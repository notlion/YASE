define(function (require) {

  "use strict";

  var _    = require("underscore")
    , LZMA = require("lzma");


  var Params = {};


  var trim_leading_zero_re  = /^\-?0+(?!\.0+$)/
    , trim_trailing_zero_re = /\.?0+$/;

  function formatNumber (num, len) {
    if(len < 1)
      return num;
    return num.toFixed(len)
      .replace(trim_leading_zero_re, num < 0 ? "-" : "")
      .replace(trim_trailing_zero_re, "");
  }


  var url_hash_re = /[#&]([\w\-\.,]+)=([\w\-\.,]+)/g;

  Params.parse = function (hash) {
    var res, params = {};
    while(res = url_hash_re.exec(hash)) {
      params[res[1]] = res[2].indexOf(",") === -1 ? res[2]
                                                  : res[2].split(",");
    }
    return params;
  }

  Params.stringify = function (params, fract_len) {
    var k, v, hash = [], num = "number";
    for(k in params) {
      v = params[k];
      if(typeof v == num)
        v = formatNumber(v, fract_len);
      else if(v instanceof Array)
        v = _.map(v, function (v) {
          return typeof v == num ? formatNumber(v, fract_len) : v;
        }).join(",");
      hash.push(k + "=" + v);
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

  Params.lzmaCompress = function (str, mode, callback) {
    compressor.compress(str, mode, function (res) {
      callback(byteArrayToHex(res));
    });
  };

  Params.lzmaDecompress = function (hex, callback) {
    compressor.decompress(hexToByteArray(hex), callback);
  };


  return Params;

});
