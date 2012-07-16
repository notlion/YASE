define(function (require) {

  "use strict";

  var Backbone = require("backbone")
    , _        = require("underscore");


  var template_svg = _.template([
    '<svg title="<%= title %>"',
         'width="<%= size %>" height="<%= size %>"',
         'version="1.2" xmlns="http://www.w3.org/2000/svg">',
      '<g transform="translate(<%= size / 2 %>,<%= size / 2 %>)">',
        '<g class="rotate">',
          '<circle cx="0" cy="0" r="<%= radius %>"/>',
          '<%= icon %>',
        '</g>',
      '</g>',
    '</svg>'
  ].join(""));

  var ProgEditorButtonView = Backbone.View.extend({

    initialize: function () {
      this.setElement(this.make("div", { "class": this.model.get("name") }));
      this.model.on("change:icon", this.render, this);
      this.render();
    },

    render: function () {
      this.$el.html(template_svg(this.model.toJSON()));
      return this;
    }

  });

  return ProgEditorButtonView;

});
