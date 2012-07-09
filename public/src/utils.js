define(function () {

  "use strict";

  var utils = {};

  utils.clamp = function (v, min, max) {
    return v < min ? min : (v > max ? max : v);
  };

  var requestAnimFrameFn = (function () {
    return window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame    ||
           window.oRequestAnimationFrame      ||
           window.msRequestAnimationFrame     ||
           function (callback) {
             window.setTimeout(callback, 1000 / 60);
           };
  })();

  utils.requestAnimationFrame = function (callback) {
    requestAnimFrameFn.call(window, callback); // Call in window scope
  };

  return utils;

});
