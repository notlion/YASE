define(function (require) {

  "use strict";

  var Backbone = require("backbone")
    , _        = require("underscore")
    , $        = require("zepto")
    , io       = require("socket.io")

    , Params = require("src/params")

    , ProgEditor = require("src/models/ProgEditor")

    , src_step_vertex   = require("text!template/step.vsh")
    , src_step_fragment = require("text!template/step.fsh")
    , src_step_template = require("text!template/step_template.fsh");


  var Toy = Backbone.Model.extend({

    defaults: {
      fbo_res: 512,
      fbo_res_shadow: 512,
      shadow_volume_scale: 10,
      rotation: null,
      distance: null,
      rendering: false
    },

    initialize: function () {
      var self = this;

      var EditorCollection = Backbone.Collection.extend({
        model: ProgEditor
      })

      this.editors = new EditorCollection([
        {
          id: "left",
          src_vertex: src_step_vertex,
          src_fragment: src_step_fragment,
          src_fragment_template: src_step_template
        },
        {
          id: "right",
          src_vertex: src_step_vertex,
          src_fragment: src_step_fragment,
          src_fragment_template: src_step_template
        }
      ])


      // Socket Interface

      this.socket = io.connect("http://localhost:4000")

      // Event Listeners

      this.editors.each(function (editor) {
        function suffix(addr) {
          return addr + "/" + editor.id
        }

        self.socket
          .on("connect", function() {
            self.socket.emit(suffix("src_fragment"), editor.get("src_fragment"))
          })
          .on(suffix("errors"), function (errors) {
            editor.set("errors", errors)
          })
          .on(suffix("compiled"), function (compiled) {
            editor.set("compiled", compiled)
          })
          .on(suffix("shader_id"), function (shader_id) {
            editor.set("shader_id", shader_id)
          })

        editor
          .on("change:errors", function (editor, errors) {
            if(errors.length > 0)
              console.log("Compile Errors:\n", errors);
          })
          .on("change:src_fragment", function (editor, src) {
            self.socket.emit(suffix("src_fragment"), src)
            editor.set("saved", false);
          })
      })
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
    }

  });

  return Toy;

});
