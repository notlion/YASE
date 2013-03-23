define(function (require) {

  "use strict"

  var Backbone = require("backbone")
    , _        = require("underscore")

    , ProgEditorView  = require("src/views/ProgEditorView")
    , HelpOverlayView = require("src/views/HelpOverlayView")
    , LinkOverlayView = require("src/views/LinkOverlayView")


  var ToyView = Backbone.View.extend({

    initialize: function() {
      var self = this
        , toy = this.model

      this.setElement(document.getElementById("gl-canvas"))


      // Init Subviews

      toy.editors.each(function (editor) {
        var view = new ProgEditorView({
          id: "prog-editor-" + editor.id,
          model: editor
        })
        view.$el.appendTo(document.body)
      })
    }

  })

  return ToyView

})
