define(function (require) {

  "use strict";

  var Backbone   = require("backbone")
    , _          = require("underscore")
    , CodeMirror = require("codemirror")

    , ProgEditor           = require("../models/ProgEditor")
    , ProgEditorButtonView = require("./ProgEditorButtonView");

  require("codemirror-glsl");


  var init_template = [
    '<div class="code-container" style="opacity:0"></div>',
    '<div class="ui"></div>'
  ].join("");

  var ProgEditorView = Backbone.View.extend({

    tagName: "div",
    id: "prog-editor",

    events: {
      "click .toggle-open": "toggleOpen"
    },

    initialize: function () {
      var self = this;

      if(!this.model)
        this.model = new ProgEditor();

      this.cm_error_marks = [];

      this.model
        .on("change:compiled", function (model, compiled) {
          if(compiled)
            self.clearErrorMarks();
        })
        .on("change:errors", function (model, errors) {
          self.markErrors(errors);
        })
        .on("change:open", function (model, open) {
          var d = 200, e = "ease", vis = "visibility"
            , sel = self.$el.find(".code-container, .hides-when-closed");
          self.$el.find(".toggle-open .rotate").animate({
            rotate: open ? "45deg" : "0"
          }, d, e);
          sel.animate({
            opacity: open ? 1 : 0
          }, d, e, function () {
            if(!self.model.get("open"))
              sel.hide();
          });
          if(open) {
            sel.show();
            self.cm_code.refresh();
          }
        });

      this.render();
    },

    toggleOpen: function () {
      this.model.set("open", !this.model.get("open"));
    },

    getProg: function () {
      return this.program.program;
    },

    updateCode: function () {
      this.cm_code.setValue(this.model.get("src_fragment"));
      return this;
    },

    markErrors: function (errors) {
      this.clearErrorMarks();
      _.each(errors, function (err) {
        this.cm_error_marks.push(this.cm_code.markText(
          { line: err.line, ch: 0 },
          { line: err.line },
          "error"
        ));
      }, this);
    },

    clearErrorMarks: function () {
      var mark;
      while(mark = this.cm_error_marks.pop())
        mark.clear();
    },

    render: function () {
      this.$el.html(_.template(init_template));

      var self = this
        , container = this.$el.find(".code-container")[0];

      this.cm_code = new CodeMirror(container, {
        value: this.model.get("src_fragment"),
        mode: "text/x-glsl",
        dragDrop: false,
        tabSize: 2,
        autoClearEmptyLines: true,
        lineWrapping: true,
        matchBrackets: true,
        onCursorActivity: function () { self.cm_code.refresh(); },
        onChange: function () {
          self.model.set("src_fragment", self.cm_code.getValue());
        }
      });
      this.cm_code.getWrapperElement().style.visibility = "visible";

      this.model.buttons.each(function (b) {
        this.append(new ProgEditorButtonView({ model: b }).render().el)
      }, this.$el.find(".ui"));

      this.updateCode();
    }

  });

  return ProgEditorView;

});
