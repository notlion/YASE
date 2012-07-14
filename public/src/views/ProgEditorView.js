define(function (require) {

  "use strict";

  var Backbone   = require("backbone")
    , _          = require("underscore")
    , CodeMirror = require("codemirror")

    , ProgEditor           = require("../models/ProgEditor")
    , ProgEditorButtonView = require("./ProgEditorButtonView");

  require("codemirror-glsl");


  var init_template = [
    '<div class="code-container" style="opacity:0">',
      // '<textarea class="code" cols="80" spellcheck="false"></textarea>',
    '</div>',
    '<div class="ui"></div>'
  ].join("");

  var ProgEditorView = Backbone.View.extend({

    tagName: "div",
    id: "prog-editor",

    events: {
      "click .toggle-open": "toggleOpen",
      "keydown .code":      "keyDown",
      "keyup .code":        "keyUp"
    },

    initialize: function () {
      var self = this;

      if(!this.model)
        this.model = new ProgEditor();

      this.model
        // .on("change:src_fragment", this.updateCode, this)
        .on("change:compiled", function (model, compiled) {
          if(compiled)
            self.$el.removeClass("error");
          else
            self.$el.addClass("error");
        })
        .on("change:error", function (model, error) {
          console.error(error);
        })
        .on("change:open", function (model, open) {
          var d = 200, e = "ease", vis = "visibility"
            , container = self.$el.find(".code-container");
          self.$el.find(".toggle-open .rotate").animate({
            rotate: open ? "45deg" : "0"
          }, d, e);
          container.animate({
            opacity: open ? 1 : 0
          }, d, e, function(){
            if(open)
              self.cm_code.refresh();
            else
              container.hide();
          });
          if(open)
            container.show();
        });

      this.render();
    },

    keyDown: function (e) {
      e.stopPropagation();

      if(e.keyCode == 9) { // Tab
        e.preventDefault();

        var ta    = e.target
          , start = ta.selectionStart
          , end   = ta.selectionEnd;

        ta.value = ta.value.substring(0, start) + "  " +
                   ta.value.substring(end, ta.value.length);

        ta.selectionStart = ta.selectionEnd = start + 2;

        ta.focus();
      }
    },

    keyUp: function (e) {
      e.stopPropagation();

      if((e.keyCode >= 16 && e.keyCode <= 45) ||
         (e.keyCode >= 91 && e.keyCode <= 93))
        return;

      this.model.set("src_fragment", e.target.value);
    },

    toggleOpen: function () {
      this.setOpen(!this.model.get("open"));
    },

    setOpen: function (open) {
      this.model.set("open", open);
    },

    getProg: function () {
      return this.program.program;
    },

    updateCode: function () {
      this.cm_code.setValue(this.model.get("src_fragment"));
      return this;
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
