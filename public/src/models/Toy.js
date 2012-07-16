define(function (require) {

  "use strict";

  var Backbone = require("backbone")
    , _        = require("underscore")
    , Embr     = require("embr")

    , ProgEditor = require("src/models/ProgEditor")
    , Soundcloud = require("src/models/Soundcloud")

    , src_copy_vertex    = require("text!template/copy.vsh")
    , src_copy_fragment  = require("text!template/copy.fsh")
    , src_step_vertex    = require("text!template/step.vsh")
    , src_step_fragment  = require("text!template/step.fsh")
    , src_final_vertex   = require("text!template/final.vsh")
    , src_final_fragment = require("text!template/final.fsh")
    , src_step_template  = require("text!template/step_template.fsh");


  var Toy = Backbone.Model.extend({

    defaults: {
      fbo_res: 512
    },

    initialize: function () {
      var self = this;

      this.editor = new ProgEditor({
        src_vertex: src_step_vertex,
        src_fragment: src_step_fragment.trim(),
        src_fragment_template: src_step_template
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
    },

    initGL: function () {
      var self = this
        , gl = this.get("context");

      Embr.setContext(gl);

      if(!gl.getExtension("OES_texture_float"))
        throw "Float textures not supported :("

      this.prog_copy = new Embr.Program(src_copy_vertex, src_copy_fragment)
        .link();
      this.prog_final = new Embr.Program(src_final_vertex, src_final_fragment)
        .link();

      var res = this.get("fbo_res");


      // Generate texture data

      var n = res * res
        , index_data    = new Float32Array(n)
        , texcoord_data = new Float32Array(n * 2)
        , position_data = new Float32Array(n * 4)
        , i, i2, i4;

      for(i = 0; i < texcoord_data.length; ++i) {
        i2 = i * 2; i4 = i * 4;
        index_data[i] = i / (n - 1);
        texcoord_data[i2    ] = (i % res) / res;
        texcoord_data[i2 + 1] = Math.floor(i / res) / res;
        position_data[i4    ] = texcoord_data[i2    ] - 0.5;
        position_data[i4 + 1] = texcoord_data[i2 + 1] - 0.5;
        position_data[i4 + 3] = 1;
      }


      // Create framebuffers

      var fbo_fmt = { width: res, height: res, type: gl.FLOAT }
        , fbo_fmt_position = _.extend(fbo_fmt, { data: position_data });

      this.fbo_read = new Embr.Fbo()
        .attach(new Embr.Texture(fbo_fmt_position))
        .check();
      this.fbo_write = new Embr.Fbo()
        .attach(new Embr.Texture(fbo_fmt_position))
        .check();

      this.fbo_prev_read = new Embr.Fbo()
        .attach(new Embr.Texture(fbo_fmt_position))
        .check();
      this.fbo_prev_write = new Embr.Fbo()
        .attach(new Embr.Texture(fbo_fmt_position))
        .check();


      // Create index texture

      this.tex_index = new Embr.Texture(_.extend(fbo_fmt, {
        format: gl.LUMINANCE,
        format_internal: gl.LUMINANCE,
        data: index_data
      }));


      // Create vertexbuffers

      this.vbo_particles = new Embr.Vbo(gl.POINTS)
        .setAttr("a_texcoord", { size: 2, data: texcoord_data })
        .setAttr("a_index", { size: 1, data: index_data })
        .setProg(this.prog_final);

      this.vbo_plane = new Embr.Vbo(gl.TRIANGLE_STRIP)
        .setAttr("a_position", {
          data: [ -1, -1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0 ], size: 3
        })
        .setAttr("a_texcoord", {
          data: [ 0, 0, 0, 1, 1, 0, 1, 1 ], size: 2
        });


      // Create audio textures

      var eq_tex_fmt = {
        width: this.audio.get("num_bands"),
        height: 1,
        format: gl.LUMINANCE,
        format_internal: gl.LUMINANCE
      };

      this.tex_eq_left = new Embr.Texture(eq_tex_fmt);
      this.tex_eq_right = new Embr.Texture(eq_tex_fmt);


      this.editor.on("compile", function (program) {
        self.vbo_plane.setProg(program);
      });

      this.audio
        .on("change:eq_left", function (audio, eq_left) {
          self.tex_eq_left.set({ data: eq_left });
        })
        .on("change:eq_right", function (audio, eq_right) {
          self.tex_eq_right.set({ data: eq_right });
        });
    },

    swap: function () {
      var tmp = this.fbo_read;
      this.fbo_read = this.fbo_write;
      this.fbo_write = tmp;
      tmp = this.fbo_prev_read;
      this.fbo_prev_read = this.fbo_prev_write;
      this.fbo_prev_write = tmp;
    },

    getUrlParams: function () {
    }

  });

  return Toy;

});
