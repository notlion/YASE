define(function (require) {

  "use strict";

  var Backbone = require("backbone")
    , _        = require("underscore")
    , Embr     = require("embr")

    , utils   = require("src/utils")
    , Arcball = require("src/Arcball")

    , ProgEditorView  = require("src/views/ProgEditorView")
    , HelpOverlayView = require("src/views/HelpOverlayView");

  window.Embr = Embr;


  var ToyView = Backbone.View.extend({

    initialize: function () {
      var self = this
        , toy = this.model;

      this.setElement(document.getElementById("gl-canvas"));


      // Init WebGL

      this.el.addEventListener("webglcontextlost", function (e) {
        e.preventDefault();
        self.stop();
      }, false);
      this.el.addEventListener("webglcontextrestored", function (e) {
        toy.initGL();
        toy.editor.compile();
        self.start();
      }, false);

      toy.set("context", utils.getWebGLContext(this.el));


      // Init Arcball + Matrices

      this.projection = mat4.create();
      this.modelview = mat4.create();
      this.modelview_inv = mat4.create();
      this.mvp = mat4.create();
      this.camera_pos = vec3.create();

      this.arcball = new Arcball(this.el);


      // Init Subviews

      this.editor_view = new ProgEditorView({ model: toy.editor });
      this.editor_view.$el.appendTo(document.body);

      this.help_view = new HelpOverlayView({ model: toy.help });
      this.help_view.$el.appendTo(document.body);


      // Assign event listeners

      toy
        .on("change:rotation", function (toy, r) {
          self.arcball.setRotation(r);
        })
        .on("change:distance", function (toy, d) {
          self.arcball.setDistance(d);
        });

      toy.editor
        .on("change:define_pixel_scale", this.layout, this);

      toy.audio
        .on("change:queued_sound", function (audio, sound) {
          // TODO: Present some UI here.
          audio.playQueued();
        });

      this.arcball
        .on("change:rotation", function (arcball, r) {
          toy.set("rotation", [ r[0], r[1], r[2], r[3] ]);
        })
        .on("change:distance", function (arcball, d) {
          toy.set("distance", d);
        });


      // Init Mouse

      this.mouse_pos = vec3.create();

      $(document).on("mousemove", function (e) {
        self.mouse_pos[0] = e.clientX / self.el.clientWidth;
        self.mouse_pos[1] = 1 - (e.clientY / self.el.clientHeight);
      });
      $(window).on("resize", function () {
        self.layout();
      });


      // Start

      toy.editor.compile();
      this.layout();
    },

    layout: function () {
      var sc = +this.model.editor.get("define_pixel_scale") || 1;
      var w = this.el.width = this.el.clientWidth / sc;
      var h = this.el.height = this.el.clientHeight / sc;
      this.aspect = w / h;
    },

    start: function () {
      var self = this;
      this.start_time = Date.now();
      this.frame_num = 0;
      (function renderLoop () {
        self.loop_handle = utils.requestAnimationFrame(renderLoop);
        self.render();
      })();
    },

    stop: function () {
      utils.cancelAnimationFrame(this.loop_handle);
    },

    render: function () {
      var gl = Embr.gl
        , toy = this.model
        , time = (Date.now() - this.start_time) / 1000
        , res = toy.get("fbo_res");


      this.arcball.getModelView(this.modelview);
      mat4.perspective(60, this.aspect, 0.01, 100.0, this.projection);
      mat4.multiply(this.projection, this.modelview, this.mvp);

      vec3.set([ 0, 0, 0 ], this.camera_pos);
      mat4.inverse(this.modelview, this.modelview_inv);
      mat4.multiplyVec3(this.modelview_inv, this.camera_pos);


      gl.viewport(0, 0, res, res);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);


      // Copy previous step

      toy.fbo_prev_write.bind();

        toy.fbo_read.textures[0].bind(0); // Position
        toy.vbo_plane
          .setProg(toy.prog_copy.use({ u_position: 0 }))
          .draw();

        toy.fbo_write.textures[0].unbind();

      toy.fbo_prev_write.unbind();


      // Render particle step pass

      if(toy.editor.program.linked) {
        toy.fbo_write.bind();

          toy.fbo_read.textures[0].bind(0);      // Position
          toy.fbo_prev_read.textures[0].bind(1); // Previous position
          toy.tex_index.bind(2);
          toy.tex_eq_left.bind(3);
          toy.tex_eq_right.bind(4);

          toy.editor.program.use({
            position:      0,
            position_prev: 1,
            index:         2,
            amp_left:      3,
            amp_right:     4,
            resolution:    res,
            oneOverRes:    1.0 / res,
            count:         res * res,
            mousePos:      this.mouse_pos,
            cameraPos:     this.camera_pos,
            time:          time,
            frame:         this.frame_num,
            progress:      toy.audio.get("progress")
          });

          toy.vbo_plane
            .setProg(toy.editor.program)
            .draw();

          toy.fbo_read.textures[0].unbind();
          toy.fbo_prev_read.textures[0].unbind();
          toy.tex_index.unbind();
          toy.tex_eq_left.unbind();
          toy.tex_eq_right.unbind();

        toy.fbo_write.unbind();
        toy.swap();

        this.frame_num++;
      }


      // Render view pass

      gl.viewport(0, 0, this.el.width, this.el.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);

      toy.fbo_read.textures[0].bind(0); // Position

      toy.prog_final.use({
        u_mvp: this.mvp,
        u_position: 0,
        u_color: 1,
        u_point_size: +this.model.editor.get("define_point_size") || 2
      });

      toy.vbo_particles.draw();

      toy.fbo_read.textures[0].unbind();
    }

  });

  return ToyView;

});
