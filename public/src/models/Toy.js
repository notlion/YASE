define(function (require) {

  "use strict";

  var Backbone = require("backbone")
    , $        = require("zepto")
    , Embr     = require("embr")

    , ProgEditor = require("src/models/ProgEditor")
    , Soundcloud = require("src/models/Soundcloud")

    , src_vertex             = require("text!template/default.vsh")
    , src_fragment           = require("text!template/default.fsh")
    , src_user_step_template = require("text!template/user_step.fsh");


  var Toy = Backbone.Model.extend({

    initialize: function () {
      var self = this;

      this.editor = new ProgEditor({
        src_vertex: src_vertex,
        src_fragment: src_fragment.trim(),
        src_fragment_template: src_user_step_template
      });

      this.audio = new Soundcloud();

      this.editor
        .on("change:define_track", function (editor, url) {
          self.audio.loadTrackData(url);
        })
        .on("change:define_smoothing", function (editor, s) {
          if(!isNaN(s))
            self.audio.set("eq_mix", 1 - s);
        });


      // Event Listeners

      this.on("change:context", this.initGL, this);

      this.audio
        .on("change:queued_sound", function (audio, sound) {
          // TODO: Present some UI here.
          audio.playQueued();
        });
    },

    initGL: function () {
      var self = this
        , gl = this.get("context");

      Embr.setContext(gl);

      this.plane = new Embr.Vbo(gl.TRIANGLE_STRIP)
        .setAttr("a_position", {
          data: [ -1, -1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0 ], size: 3
        })
        .setAttr("a_texcoord", {
          data: [ 0, 0, 0, 1, 1, 0, 1, 1 ], size: 2
        });

      var tex_fmt = {
        width: this.audio.get("num_bands"),
        height: 1,
        format: gl.LUMINANCE,
        format_internal: gl.LUMINANCE
      };

      this.eq_texture_left = new Embr.Texture(tex_fmt);
      this.eq_texture_right = new Embr.Texture(tex_fmt);

      this.editor.on("compile", function (program) {
        self.plane.setProg(program);
      });

      this.audio
        .on("change:eq_left", function (audio, eq_left) {
          self.eq_texture_left.set({ data: eq_left });
        })
        .on("change:eq_right", function (audio, eq_right) {
          self.eq_texture_right.set({ data: eq_right });
        });
    }

  });

  return Toy;

});
