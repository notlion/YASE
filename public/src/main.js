requirejs.config({
  shim: {
    "backbone": {
      deps: [ "underscore", "zepto" ],
      exports: function () {
        return this.Backbone.noConflict();
      }
    }
  , "underscore": {
      exports: function () {
        return this._.noConflict();
      }
    }
  , "zepto": {
      exports: "Zepto"
    }
  , "lzma": {
      exports: "LZMA"
    }
  , "codemirror": {
      exports: "CodeMirror"
    }
  , "codemirror-glsl": {
      deps: [ "codemirror" ]
    }
  , "socket.io": {
      exports: "io"
    }
  }
, baseUrl: "../"
, paths: {
    "text":            "lib/text"
  , "backbone":        "lib/backbone"
  , "underscore":      "lib/underscore"
  , "zepto":           "lib/zepto"
  , "lzma":            "lib/lzma/lzma"
  , "codemirror":      "lib/codemirror/codemirror"
  , "codemirror-glsl": "lib/codemirror/glsl"
  , "socket.io":       "lib/socket.io"
  }
});
require([ "src/models/Toy", "src/views/ToyView" ], function (Toy, ToyView) {
  window.toy = new Toy();
  window.toyview = new ToyView({ model: window.toy });
});
