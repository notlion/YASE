define(function (require) {

  "use strict";

  var Backbone = require("backbone")
    , _        = require("underscore")
    , $        = require("zepto")
    , Embr     = require("embr")

    , Params = require("src/params")

    , ProgEditor  = require("src/models/ProgEditor")
    , HelpOverlay = require("src/models/HelpOverlay")
    , Soundcloud  = require("src/models/Soundcloud")

    , src_copy_vertex    = require("text!template/copy.vsh")
    , src_copy_fragment  = require("text!template/copy.fsh")
    , src_step_vertex    = require("text!template/step.vsh")
    , src_step_fragment  = require("text!template/step.fsh")
    , src_final_vertex   = require("text!template/final.vsh")
    , src_final_fragment = require("text!template/final.fsh")
    , src_depth_vertex   = require("text!template/depth.vsh")
    , src_depth_fragment = require("text!template/depth.fsh")
    , src_step_template  = require("text!template/step_template.fsh");


  var Toy = Backbone.Model.extend({

    defaults: {
      fbo_res: 512,
      fbo_res_shadow: 512,
      shadow_volume_scale: 10,
      rotation: null,
      distance: null,
      rendering: false,
    },

    initialize: function () {
      var self = this;

      this.editor = new ProgEditor({
        src_vertex: src_step_vertex,
        src_fragment_template: src_step_template
      });
      this.editor.buttons.add([
        {
          name: "save",
          title: "Save",
          hides_when_closed: true
        },
        {
          name: "share",
          title: "Share",
          hides_when_closed: true
        },
        {
          name: "help",
          title: "?",
          hides_when_closed: true
        }
      ]);

      this.help = new HelpOverlay({
        src: src_step_template
      });

      this.link = new Backbone.Model({ open: false });

      this.audio = new Soundcloud();


      // Event Listeners

      this.editor
        .on("change:errors", function (editor, errs) {
          console.log("Compile Errors:\n", errs);
        })
        .on("change:define_track", function (editor, url) {
          self.audio.loadTrackData(url);
        })
        .on("change:define_smoothing", function (editor, s) {
          if(!isNaN(s))
            self.audio.set("eq_mix", 1 - s);
        })
        .on("change:define_sim_res", function (editor, res) {
          if(!isNaN(res) && res > 0)
            self.set("fbo_res", +res);
        })
        .on("change:src_fragment", function (editor) {
          self.setSaved(false);
        })
        .on("save", this.saveParams, this);

      this
        .on("change:context change:fbo_res", function () {
          self.initGL();
        })
        .on("change:rotation change:distance", function () {
          self.setSaved(false);
        });

      this.editor.buttons.get("save").on("click", this.editor.save, this.editor);
      this.editor.buttons.get("share").on("click", this.saveParamsLink, this);
      this.editor.buttons.get("help").on("click", function () {
        self.help.set("open", true);
      });

      this.help.on("change:open", function (help, open) {
        self.editor.buttons.get("help").set("enabled", !open);
        self.set("rendering", !open);
      });
    },

    initGL: function () {
      var self = this
        , gl = this.get("context");

      Embr.setContext(gl);

      if(!(this.ext_oes_float = gl.getExtension("OES_texture_float")))
        throw "Float textures not supported :("
        // TODO: Implement some better UI to notify this happened.


      // Create shader programs

      this.prog_copy = new Embr.Program(src_copy_vertex, src_copy_fragment).link();
      this.prog_final = new Embr.Program(src_final_vertex, src_final_fragment).link();
      this.prog_depth = new Embr.Program(src_depth_vertex, src_depth_fragment).link();


      var res = this.get("fbo_res");
      var res_shadow = this.get("fbo_res_shadow");


      // Generate texture data

      var n = res * res
        , index_data    = new Float32Array(n)
        , texcoord_data = new Float32Array(n * 2)
        , position_data = new Float32Array(n * 4)
        , i, i2, i4;

      for(i = 0; i < texcoord_data.length; ++i) {
        i2 = i * 2; i4 = i * 4;
        index_data[i] = i;
        texcoord_data[i2    ] = (i % res + 0.5) / res;
        texcoord_data[i2 + 1] = (Math.floor(i / res) + 0.5) / res;
        position_data[i4    ] = texcoord_data[i2    ] - 0.5;
        position_data[i4 + 1] = texcoord_data[i2 + 1] - 0.5;
        position_data[i4 + 3] = 1;
      }


      // Create step framebuffers

      var fbo_fmt = { width: res, height: res, type: gl.FLOAT }
        , fbo_fmt_position = _.extend(fbo_fmt, { data: position_data });

      if(this.fbo_read)  this.fbo_read.cleanup();
      if(this.fbo_write) this.fbo_write.cleanup();

      this.fbo_read = new Embr.Fbo()
        .attach(new Embr.Texture(fbo_fmt_position))
        .check();
      this.fbo_write = new Embr.Fbo()
        .attach(new Embr.Texture(fbo_fmt_position))
        .check();

      if(this.fbo_prev_read)  this.fbo_prev_read.cleanup();
      if(this.fbo_prev_write) this.fbo_prev_write.cleanup();

      this.fbo_prev_read = new Embr.Fbo()
        .attach(new Embr.Texture(fbo_fmt_position))
        .check();
      this.fbo_prev_write = new Embr.Fbo()
        .attach(new Embr.Texture(fbo_fmt_position))
        .check();


      // Create shadow framebuffer

      this.fbo_shadow_depth = new Embr.Fbo()
        .attach(new Embr.Texture({
          width: res_shadow, height: res_shadow,
          type: gl.FLOAT,
          data: null
        }))
        .attach(new Embr.Rbo({ width: res_shadow, height: res_shadow }))
        .check();


      // Create index texture

      if(this.tex_index) this.tex_index.cleanup();

      this.tex_index = new Embr.Texture(_.extend(fbo_fmt, {
        format: gl.LUMINANCE,
        format_internal: gl.LUMINANCE,
        data: index_data
      }));


      // Create vertexbuffers

      if(this.vbo_particles) this.vbo_particles.cleanup();
      if(this.vbo_plane)     this.vbo_plane.cleanup();

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
        format_internal: gl.LUMINANCE,
        data: null
      };

      if(this.tex_eq_left)  this.tex_eq_left.cleanup();
      if(this.tex_eq_right) this.tex_eq_right.cleanup();

      this.tex_eq_left = new Embr.Texture(eq_tex_fmt);
      this.tex_eq_right = new Embr.Texture(eq_tex_fmt);


      // Events

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

    setSaved: function (saved) {
      this.editor.buttons.get("save").set({
        title: saved ? "Saved" : "Save",
        enabled: !saved
      });
      if(!saved)
        this.editor.buttons.get("share").set("enabled", true);
    },

    getParams: function (callback) {
      var self = this;
      Params.lzmaCompress(this.editor.get("src_fragment"), 1, function (res) {
        var params = {};
        if(self.has("rotation"))
          params.r = self.get("rotation");
        if(self.has("distance"))
          params.d = self.get("distance");
        params.z = res;
        callback(params);
      });
    },

    saveParamsLink: function () {
      var self = this;
      this.getParams(function (params) {
        $.ajax({
          url: "/save",
          type: "post",
          data: params,
          dataType: "json",
          success: function(res) {
            self.editor.buttons.get("share").set("enabled", false);
            self.link.set(res);
            self.link.set("open", true);
          }
        });
      });
    },

    saveParams: function () {
      var self = this;
      this.getParams(function (params) {
        window.location.hash = Params.stringify(params, 3);
        self.setSaved(true);
      });
    },

    loadParams: function (params, callback) {
      if(params.z) {
        Params.lzmaDecompress(params.z, function (res) {
          params.z = res;
          callback(params);
        });
      }
      else {
        callback(params);
      }
    },

    loadHashParams: function (callback) {
      var self = this, hash = window.location.hash;

      if(hash.length === 0) {
        callback({});
        return;
      }

      if(hash.indexOf("=") >= 0)
        this.loadParams(Params.parse(hash), callback);
      else
        $.ajax({
          url: "/get/" + hash.slice(1),
          type: "get",
          dataType: "json",
          success: function(res) {
            self.loadParams(res, callback)
          }
        });
    },

    start: function () {
      var self = this;
      this.loadHashParams(function (params) {
        if(params.r instanceof Array && params.r.length === 4) {
          self.set("rotation", params.r);
        }
        if(params.d !== null && !isNaN(params.d))
          self.set("distance", parseFloat(params.d));
        if(params.z)
          self.editor.set("src_fragment", params.z);
        else
          self.editor.set("src_fragment", src_step_fragment);
        self.set("rendering", true);
      });
    }

  });

  return Toy;

});
