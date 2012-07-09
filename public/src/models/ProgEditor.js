define(function (require) {

  "use strict";

  var Backbone = require("backbone")
    , _        = require("underscore")
    , Embr     = require("embr")

    , ProgEditorButton = require("./ProgEditorButton");


  var shader_outlet_re = /^[ \t]*#define[ \t]+([\w_]*)[ \t]+(\S+)/gm;

  function extractShaderDefines (src) {
    var match, i, defines = {};
    while(match = shader_outlet_re.exec(src)) {
      for(i = 1; i < match.length; i += 2)
        defines[match[i].toLowerCase()] = match[i + 1];
    }
    return defines;
  }

  var ProgEditor = Backbone.Model.extend({

    defaults: {
      open: false,
      src_vertex: "",
      src_fragment: "",
      src_fragment_template: ""
    },

    initialize: function () {
      this.buttons = new ProgEditorButton.Collection([
        {
          name: "toggle-open",
          title: "Toggle Code Open",
          icon: '<path d="M -7,0 L 7,0 M 0,-7 L 0,7"/>'
        },
      ]);
      this.program = new Embr.Program();
      this.on("change:src_vertex change:src_fragment", this.compile, this);
    },

    compile: _.debounce(function () {
      var vs = this.get("src_vertex")
        , fs = this.get("src_fragment")
        , vt = this.get("src_vertex_template")
        , ft = this.get("src_fragment_template");

      if(vs && fs) {
        _.each(extractShaderDefines(fs), function (value, name) {
          if(_.isNumber(value))
            value = +value;
          this.set("define_" + name, value);
        }, this);

        if(vt)
          vs = _.template(vt, this.attributes);
        if(ft)
          fs = _.template(ft, this.attributes);

        try {
          this.program.compile(vs, fs);
          this.program.link();
        }
        catch(err) {
          this.set("error", err.toString());
          this.set("compiled", false);
          return;
        }

        this.set("compiled", true);
        this.trigger("compile", this.program);
      }
    }, 200)

  });

  return ProgEditor;

});
