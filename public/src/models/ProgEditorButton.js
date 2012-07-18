define(function (require) {

  "use strict";

  var Backbone = require("backbone");


  var ProgEditorButton = Backbone.Model.extend({

    defaults: {
      enabled: true,
      size:    30,
      radius:  13,
      icon:    null,
      title:   "",
      hides_when_closed: false
    },

    initialize: function () {
      if(!this.id)
        this.set("id", this.get("name"));
    }

  });

  ProgEditorButton.Collection = Backbone.Collection.extend({
    model: ProgEditorButton
  });

  return ProgEditorButton;

});
