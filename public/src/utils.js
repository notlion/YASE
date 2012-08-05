define(function () {

  "use strict";

  var utils = {};

  // var deg_to_rad = Math.PI / 180.0;

  utils.clamp = function (v, min, max) {
    return v < min ? min : (v > max ? max : v);
  };

  utils.distanceToDepth = function (z, znear, zfar) {
    return (znear * z + zfar * (-znear + z)) / ((zfar - znear) * z);
  };

  var vendors = [ "ms", "moz", "webkit", "o" ];
  var requestAnimFrame = window.requestAnimationFrame
    , cancelAnimFrame  = window.cancelAnimationFrame;

  for(var i = 0; i < vendors.length && !requestAnimFrame; ++i) {
    requestAnimFrame = window[vendors[i] + "RequestAnimationFrame"];
    cancelAnimFrame  = window[vendors[i] + "CancelAnimationFrame"] ||
                       window[vendors[i] + "CancelRequestAnimationFrame"];
  }

  utils.requestAnimationFrame = function (callback) {
    return requestAnimFrame.call(window, callback);
  };
  utils.cancelAnimationFrame = function (callback) {
    return cancelAnimFrame.call(window, callback);
  };

  utils.getWebGLContext = function (canvas) {
    try {
       return canvas.getContext("webgl") ||
              canvas.getContext("experimental-webgl");
    }
    catch(err) {
      console.error(err);
    }
  };

  return utils;

});
