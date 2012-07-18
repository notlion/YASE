{
  baseUrl: "public",
  name: "lib/almond",
  include: [ "src/main" ],
  insertRequire: [ "src/main" ],
  out: "public/main-built.js",
  wrap: true,
  preserveLicenseComments: false,
  shim: {
    "backbone": {
      deps: [ "underscore", "zepto" ],
      exports: function () {
        return this.Backbone.noConflict();
      }
    },
    "underscore": {
      exports: function () {
        return this._.noConflict();
      }
    },
    "zepto": {
      exports: "Zepto"
    },
    "lzma": {
      exports: "LZMA"
    },
    "codemirror": {
      exports: "CodeMirror"
    },
    "codemirror-glsl": {
      deps: [ "codemirror" ]
    },
    "soundcloud": {
      deps: [ "soundmanager" ],
      exports: "SC"
    }
  },
  paths: {
    "text":            "lib/text",
    "embr":            "lib/embr/src/embr",
    "glmatrix":        "lib/gl-matrix",
    "backbone":        "lib/backbone",
    "underscore":      "lib/underscore",
    "zepto":           "lib/zepto",
    "lzma":            "lib/lzma/lzma",
    "codemirror":      "lib/codemirror/codemirror",
    "codemirror-glsl": "lib/codemirror/glsl",
    "soundmanager":    "lib/soundmanager/soundmanager2-nodebug",
    "soundcloud":      "http://connect.soundcloud.com/sdk"
  }
}
