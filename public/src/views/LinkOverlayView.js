define(function (require) {

  "use strict";

  var Backbone = require("backbone")
    , _        = require("underscore");


  var link_template = _.template(require("text!template/link.tpl"));


  var LinkOverlayView = Backbone.View.extend({

    className: "overlay link",

    initialize: function() {
      var self = this;

      this.model.on("change:open", function (model, open) {
        self.$el.animate({ opacity: open ? 1 : 0 }, 200, "ease", function () {
          if(!self.model.get("open"))
            self.$el.remove();
        });
        if(open)
          self.render();
      });

      this.$el.css({ opacity: 0 });
    },

    render: function() {
      var self = this;

      this.$el.html(link_template(this.model.attributes));

      function onClick (e) {
        e.preventDefault();
        self.model.set("open", false);
      }

      this.$el.on("click", function (e) {
        if(e.target === self.el) onClick(e);
      });
      this.$el.find(".close").on("click", onClick);

      if(this.$el.parent().length < 1)
        this.$el.appendTo(document.body);
    }

  });

  return LinkOverlayView;

});
