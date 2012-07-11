define(function (require) {

  "use strict";

  var Backbone = require("backbone")
    , _        = require("underscore")
    , Embr     = require("embr")

    , utils = require("src/utils")

    , ProgEditorView = require("src/views/ProgEditorView");


  function getWebGLContext (canvas) {
    try {
       return canvas.getContext("webgl") ||
              canvas.getContext("experimental-webgl");
    }
    catch(err) {
      console.error(err);
    }
  }

  var ToyView = Backbone.View.extend({

    initialize: function () {
      var self = this
        , toy = this.model;

      this.setElement(document.getElementById("gl-canvas"));


      // Init WebGL

      var gl = getWebGLContext(this.el);
      // gl = Embr.wrapContextWithErrorChecks(gl);
      toy.set("context", gl);


      // Init Subviews

      this.editor_view = new ProgEditorView({ model: toy.editor });
      this.editor_view.$el.appendTo(document.body);


      // Assign event listeners

      toy.editor.on("change:define_pixel_scale", this.layout, this);

      toy.audio
        .on("change:queued_sound", function (audio, sound) {
          // TODO: Present some UI here.
          audio.playQueued();
        });


      // Init Mouse

      this.mouse_pos = new Float32Array([ 0, 0 ]);

      $(document).on("mousemove", function (e) {
        self.mouse_pos[0] = e.clientX / self.el.clientWidth;
        self.mouse_pos[1] = 1 - (e.clientY / self.el.clientHeight);
      });
      $(window).on("resize", function () {
        self.layout();
      });


      // Start

      toy.editor.compile();
      toy.editor.set("open", true);

      this.layout();
      this.start();
    },

    layout: function () {
      var sc = this.model.editor.get("define_pixel_scale") || 1;
      var w = this.el.width = this.el.clientWidth / sc;
      var h = this.el.height = this.el.clientHeight / sc;
      this.resolution = new Float32Array([ w, h ]);
      this.aspect = w / h;
    },

    start: function () {
      var self = this;
      this.start_time = Date.now();
      this.frame_num = 0;
      (function renderLoop () {
        utils.requestAnimationFrame(renderLoop);
        self.render();
      })();
    },

    render: function () {
      var gl = Embr.gl
        , toy = this.model
        , time = (Date.now() - this.start_time) / 1000
        , res = toy.get("fbo_res");


      gl.viewport(0, 0, res, res);
      gl.disable(gl.DEPTH_TEST);


      // Copy previous step

      toy.fbo_prev_write.bind();

        toy.fbo_read.textures[0].bind(0); // Position
        toy.vbo_plane
          .setProg(toy.prog_copy.use({ u_position: 0 }))
          .draw();

        toy.fbo_write.textures[0].unbind();

      toy.fbo_prev_write.unbind();


      // Render particle step pass

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
          aspect:        this.aspect,
          resolution:    this.resolution,
          mouse:         this.mouse_pos,
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


      // Render view pass

      gl.viewport(0, 0, this.el.width, this.el.height);
      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

      var projection = mat4.perspective(60, this.aspect, 0.01, 100.0)
        , modelview = mat4.lookAt([ 0, 0, 5 ], [ 0, 0, 0 ], [ 0, 1, 0 ])
        , mvp = mat4.multiply(projection, modelview, mat4.create());

      toy.fbo_read.textures[0].bind(0); // Position

      toy.prog_final.use({
        u_mvp: mvp,
        u_position: 0,
        u_color: 1
      });

      toy.vbo_particles.draw();

      toy.fbo_read.textures[0].unbind();


      // Increment frame number

      this.frame_num++;
    }

  });

  return ToyView;

});
