define(function (require) {

  "use strict";

  var Backbone = require("backbone")
    , _        = require("underscore")
    , $        = require("zepto")
    , io       = require("socket.io")

    , Params = require("src/params")

    , ProgEditor  = require("src/models/ProgEditor")
    , HelpOverlay = require("src/models/HelpOverlay")

    , src_step_vertex    = require("text!template/step.vsh")
    , src_step_fragment  = require("text!template/step.fsh")
    , src_step_template  = require("text!template/step_template.fsh");


  var Toy = Backbone.Model.extend({

    defaults: {
      fbo_res: 512,
      fbo_res_shadow: 512,
      shadow_volume_scale: 10,
      rotation: null,
      distance: null,
      rendering: false,
      port: 4000
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

      this.link = new Backbone.Model({ open: false })


      // Socket Interface

      this.socket = io.connect("http://localhost:" + this.get("port"))

      this.socket
        .on("connect", function() {
          self.socket.emit("src_fragment", self.editor.get("src_fragment"))
        })
        .on("errors", function (errors) {
          self.editor.set("errors", errors)
        })
        .on("compiled", function (compiled) {
          self.editor.set("compiled", compiled)
        })

      // Event Listeners

      this.editor
        .on("change:errors", function (editor, errors) {
          if(errors.length > 0)
            console.log("Compile Errors:\n", errors);
        })
        .on("change:src_fragment", function (editor, src) {
          self.socket.emit("src_fragment", src)
          self.setSaved(false);
        })
        .on("save", this.saveParams, this);

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
        // if(params.r instanceof Array && params.r.length === 4) {
        //   self.set("rotation", params.r);
        // }
        // if(params.d !== null && !isNaN(params.d))
        //   self.set("distance", parseFloat(params.d));
        if(params.z)
          self.editor.set("src_fragment", params.z);
        else
          self.editor.set("src_fragment", src_step_fragment);
        // self.set("rendering", true);
      });
    }

  });

  return Toy;

});
