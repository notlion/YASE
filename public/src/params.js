define(function (require) {

  "use strict";

  var LZMA = require("lzma");


  var url_hash_re = /[#&]([\w\-\.,]+)=([\w\-\.,]+)/g;

  function parseLocationHash (hash) {
    var res, params = {};
    while((res = url_hash_regex.exec(hash)) != null) {
      params[res[1]] = res[2].indexOf(",") === -1 ? res[2]
                            : res[2].split(",");
    }
    return params;
  }

  function stringify (params) {
    var k, v, hash = [];
    for(k in params) {
      v = params[key];
      hash.push(key + "=" + (v instanceof Array ? v.join(",") : v));
    }
    return hash.join("&");
  }


  // LZMA Compression

  var compressor = new LZMA("/lib/lzma/lzma_worker.js");

  function hexToByteArray (hex) {
    var tmp, arr = [];
    for(var i = 0; i < hex.length; i += 2){
      tmp = hex.substring(i, i + 2);
      arr.push(parseInt(tmp, 16));
    }
    return arr;
  }

  function byteArrayToHex (arr) {
    var tmp, hex = "";
    for(var i = 0, n = arr.length; i < n; ++i) {
      if(arr[i] < 0)
        arr[i] += 256;

      tmp = arr[i].toString(16);

      // add leading zero
      if(tmp.length == 1)
        tmp = "0" + tmp;

      hex += tmp;
    }
    return hex;
  }


  return {

    lzmaCompress: function (str, mode, callback) {
      compressor.compress(str, mode, function (res) {
        callback(byteArrayToHex(res));
      });
    },

    lzmaDecompress: function (hex, callback) {
      compressor.decompress(hexToByteArray(hex), callback);
    }

    // saveLocationHashParams: function (params) {
    //   document.location.hash = stringify(params);
    // },

    // loadLocationHashParams: function (callbacks) {
    //   var params = parseUrlHash(document.location.hash);
    //   for(var name in params){
    //     if(name in callbacks)
    //       callbacks[name](params[name]);
    //   }
    // }

  };

});
