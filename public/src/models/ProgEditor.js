define(function (require) {

  "use strict"

  var Backbone = require("backbone")
    , _        = require("underscore")
    , Embr     = require("embr")

    , ProgEditorButton = require("./ProgEditorButton")


  var shader_outlet_re = /^[ \t]*#define[ \t]+([\w_]*)[ \t]+(\S+)/gm
    , shader_error_re = /^ERROR: (\d+):(\d+): '([^']+)' : ([\w ]+)/gm
    , template_include_re = /<%=\s*src_fragment\s*%>/


  function extractShaderDefines (src) {
    var match, i, defines = {}
    while(match = shader_outlet_re.exec(src)) {
      for(i = 1; i < match.length; i += 2)
        defines[match[i].toLowerCase()] = match[i + 1]
    }
    return defines
  }

  function parseShaderErrors (err) {
    var match, errstr = err.toString(), errs = []
    while(match = shader_error_re.exec(errstr)) {
      errs.push({
        line: +match[2],
        token: match[3],
        error: match[4]
      })
    }
    return errs
  }

  function findRowColForStringIndex (str, index) {
    var d = { row: 0, col: 0 }, lines
    if(index >= 0) {
      lines = str.slice(0, index).split(/[\r\n]/g)
      d.row = lines.length
      d.col = lines[lines.length - 1].length
    }
    return d
  }


  var ProgEditor = Backbone.Model.extend({

    defaults: {
      open: false,
      shader_id: 0,
      src_vertex: "",
      src_fragment: "",
      src_fragment_template: "",
      src_fragment_row: 0,
      src_fragment_col: 0
    },

    initialize: function () {
      this.buttons = new ProgEditorButton.Collection([
        {
          name: "toggle-open",
          title: "Toggle Code Open",
          icon: '<path d="M -7,0 L 7,0 M 0,-7 L 0,7"/>'
        },
        {
          name: "save",
          title: "Save",
          hides_when_closed: true
        }
      ])

      this.program = new Embr.Program()
      this.program_tmp = new Embr.Program()

      this
        .on("change:src_fragment_template", this.updateTemplateData, this)
        .on("change:saved", function (self, saved) {
          self.buttons.get("save").set({
            title: saved ? "Saved" : "Save",
            enabled: !saved
          })
        })
        .on("change:shader_id", this.load, this)

      this.buttons.get("save").on("click", this.save, this)

      this.updateTemplateData()
    },

    updateTemplateData: function () {
      var tmpl = this.get("src_fragment_template")
        , index = tmpl.search(template_include_re)
        , d = findRowColForStringIndex(tmpl, index)
      this.set({
        src_fragment_row: d.row,
        src_fragment_col: d.col
      })
    },

    compile: _.debounce(function() {
      var vs = this.get("src_vertex")
        , fs = this.get("src_fragment")
        , vt = this.get("src_vertex_template")
        , ft = this.get("src_fragment_template")

      if(vs && fs) {
        _.each(extractShaderDefines(fs), function(value, name) {
          if(_.isNumber(value))
            value = +value
          this.set("define_" + name, value)
        }, this)

        if(vt)
          vs = _.template(vt, this.attributes)
        if(ft)
          fs = _.template(ft, this.attributes)

        try {
          this.program_tmp.compile(vs, fs)
          this.program_tmp.link()
        }
        catch(err) {
          var i, row = this.get("src_fragment_row")
            , errs = parseShaderErrors(err)

          for(i = 0; i < errs.length; ++i)
            errs[i].line -= row

          this.set("errors", errs)
          this.set("compiled", false)

          return
        }

        this.swap()
        this.set("compiled", true)
        this.trigger("compile", this.program)
      }
    }, 200),

    swap: function() {
      var tmp = this.program_tmp
      this.program_tmp = this.program
      this.program = tmp
    },

    load: function() {
      var self = this
      $.ajax({
        url: "/shader/" + this.get("shader_id"),
        type: "get",
        success: function (res) {
          self.set("src_fragment", res)
          self.set("saved", true)
        }
      })
    },

    save: function() {
      var self = this
      $.ajax({
        url: "/shader/" + this.get("shader_id"),
        type: "post",
        data: {
          src: this.get("src_fragment")
        },
        success: function (res) {
          self.set("saved", true)
        }
      })
    }

  })

  return ProgEditor

})
