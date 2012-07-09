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

      toy.set("context", getWebGLContext(this.el));


      // Init Subviews

      this.editor_view = new ProgEditorView({ model: toy.editor });
      this.editor_view.$el.appendTo(document.body);


      // Assign event listeners

      toy.editor.on("change:define_pixel_scale", this.layout, this);


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
      (function renderLoop () {
        utils.requestAnimationFrame(renderLoop);
        self.render();
      })();
    },

    render: function () {
      var gl = Embr.gl
        , toy = this.model
        , time = (Date.now() - this.start_time) / 1000;

      gl.viewport(0, 0, this.el.width, this.el.height);

      toy.eq_texture_left.bind(0);
      toy.eq_texture_right.bind(1);

      toy.editor.program.use({
        amp_left:   0,
        amp_right:  1,
        aspect:     this.aspect,
        resolution: this.resolution,
        mouse:      this.mouse_pos,
        time:       toy.audio.get("time"),
        progress:   toy.audio.get("progress")
      });

      toy.plane.draw();
    }

  });

  return ToyView;

});
