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

  var template_button = _.template([
    '<input title="<%= title %>"',
           'value="<%= title %>"',
           'type="button"',
           'style="height:<%= size - 2 %>px;border-radius:<%= radius %>px;"/>'
  ].join(""));

  var ProgEditorButtonView = Backbone.View.extend({

    initialize: function () {
      var self = this;

      this.$el.on("click", function (e) {
        if(self.model.get("enabled")) {
          e.preventDefault();
          self.model.trigger("click");
        }
      });

      this.model.on("change", this.render, this);

      this.render();
    },

    render: function () {
      var tpl = this.model.has("icon") ? template_svg : template_button
        , classNames = [ this.model.get("name") ];

      if(this.model.get("hides_when_closed"))
        classNames.push("hides-when-closed");
      if(!this.model.get("enabled"))
        classNames.push("disabled");

      this.$el
        .attr("class", classNames.join(" "))
        .html(tpl(this.model.toJSON()));

      return this;
    }

  });

  return ProgEditorButtonView;

});
