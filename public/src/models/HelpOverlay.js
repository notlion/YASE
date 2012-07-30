define(function (require) {

  "use strict";

  var Backbone = require("backbone")
    , _        = require("underscore");


  var types = [
    {
      name: "function",
      re: /^(\w+) +(\w+)\(([\w, ]+)\) *{/gm,
      create: function (match) {
        return {
          type: match[1],
          name: match[2],
          args: match[3]
        };
      }
    },
    {
      name: "variable",
      re: /^(\w+ +\w+) +(\w+);/gm,
      create: function (match) {
        return {
          type: match[1],
          name: match[2]
        };
      }
    },
    {
      name: "define",
      re: /^#(define) +(\w+) +([\d\.]+)/gm,
      create: function (match) {
        return {
          type: match[1],
          name: match[2],
          value: match[3]
        };
      }
    }
  ];


  var HelpOverlay = Backbone.Model.extend({

    defaults: {
      open: false
    },

    initialize: function () {
      var self = this
        , src = this.get("src");

      this.entries = [];

      src.split("/**").forEach(function (chunk) {
        var i = chunk.indexOf("*/");

        if(i < 0) return;

        var v, match, rest = chunk.slice(i + 2);

        var type = _.sortBy(types, function (type) {
          var i = rest.search(type.re);
          return i < 0 ? rest.length : i;
        })[0];

        var entry = {
          comment: chunk.slice(0, i).trim().replace("\n", " "),
          type: type.name,
          signatures: []
        };
        self.entries.push(entry);

        while(match = type.re.exec(rest)) {
          entry.signatures.push(type.create(match));
        }
      });
    }

  });

  return HelpOverlay;

});
