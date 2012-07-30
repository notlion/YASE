define(function (require) {

  "use strict";

  var Backbone = require("backbone")
    , _        = require("underscore");


  var help_template = _.template(require("text!template/help.tpl"));
  var group_template = _.template([
    '<div class="<%= type %>">',
      '<h1><%= type %>s</h1>',
      '<%= contents %>',
    '</div>'
  ].join(""));
  var entry_template = _.template(require("text!template/help_entry.tpl"));


  var HelpOverlayView = Backbone.View.extend({

    tagName: "div",
    className: "help-overlay",

    initialize: function () {
      var self = this;

      this.model.on("change:open", function (model, open) {
        self.$el.animate({ opacity: open ? 1 : 0 }, 200, "ease", function () {
          if(!self.model.get("open"))
            self.$el.hide();
        });
        if(open)
          self.$el.show();
      });

      this.$el.hide();

      this.render();
    },

    render: function () {
      var self = this;

      var groups = _.reduce([
        "function",
        "variable",
        "define"
      ], function (v, type) {
        return v + group_template({
          type: type,
          contents: _.reduce(self.model.entries, function (v, entry) {
            return entry.type == type ? v + entry_template(entry) : v;
          }, "")
        });
      }, "");

      this.$el.html(help_template({ contents: groups }));

      this.$el.find(".close").on("click", function (e) {
        e.preventDefault();
        self.model.set("open", false);
      });
    }

  });

  return HelpOverlayView;

});
