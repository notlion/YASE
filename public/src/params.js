define([
  "lib/lzma/lzma"
],
function(){

  "use strict";

  var url_hash_regex = /[#&]([\w\-\.,]+)=([\w\-\.,]+)/g;

  function parseUrlHash(hash){
    var res, params = {};
    while((res = url_hash_regex.exec(hash)) != null){
      params[res[1]] = res[2].indexOf(",") === -1 ? res[2]
                            : res[2].split(",");
    }
    return params;
  }

  function stringifyParams(params){
    var hash = [];
    for(var key in params){
      hash.push(key + "=" + (params[key] instanceof Array ? params[key].join(",")
                                                          : params[key]));
    }
    return hash.join("&");
  }


  // LZMA COMPRESSION //

  var compressor = LZMA ? new LZMA("/lib/lzma/lzma_worker.js") : null;

  function hexToByteArray(hex){
    var tmp, arr = [];
    for(var i = 0; i < hex.length; i += 2){
      tmp = hex.substring(i, i + 2);
      arr.push(parseInt(tmp, 16));
    }
    return arr;
  }

  function byteArrayToHex(arr){
    var tmp, hex = "";
    for(var i = 0, n = arr.length; i < n; ++i){
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

    lzmaCompress: function(str, mode, callback){
      if(compressor){
        compressor.compress(str, mode, function(res){
          callback(byteArrayToHex(res));
        });
      }
    },

    lzmaDecompress: function(hex, callback){
      if(compressor)
        compressor.decompress(hexToByteArray(hex), callback);
    },

    saveUrlHash: function(params){
      document.location.hash = stringifyParams(params);
    },

    loadUrlHash: function(callbacks){
      var params = parseUrlHash(document.location.hash);
      for(var name in params){
        if(name in callbacks)
          callbacks[name](params[name]);
      }
    }

  };

});
