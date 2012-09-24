define(function(require) {

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

      this.editor_view = new ProgEditorView({ model: toy.editor })
      this.editor_view.$el.appendTo(document.body)

      this.help_view = new HelpOverlayView({ model: toy.help })
      this.help_view.$el.appendTo(document.body)

      this.link_view = new LinkOverlayView({ model: toy.link })
    }

  })

  return ToyView

})
