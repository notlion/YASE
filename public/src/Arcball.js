define(function (require) {

  "use strict";

  var Backbone = require("backbone")
    , _        = require("underscore")
    , utils    = require("src/utils");


  function vec3LengthSq (vec) {
    var x = vec[0], y = vec[1], z = vec[2];
    return x * x + y * y + z * z;
  }

  function getElementOffset (el) {
    var x = 0, y = 0;
    while(el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
      x += el.offsetLeft - el.scrollLeft;
      y += el.offsetTop - el.scrollTop;
      el = el.offsetParent;
    }
    return { x: x, y: y };
  }


  function Arcball (canvas) {
    var rotation = quat4.create([ 0, 0, 0, 1 ])
      , initial_rotation = quat4.create()
      , distance = 5, distance_min = 0.1, distance_max = 15
      , mouse_down_x, mouse_down_y
      , invert_x = false, invert_y = true
      , arcball = this;

    function getCanvasToSpherePnt (x, y) {
      var sx = canvas.clientWidth / 2
        , sy = canvas.clientHeight / 2
        , sr = Math.sqrt(sx * sx + sy * sy);

      var pos = vec3.create([ (x - sx) / sr, (y - sy) / sr, 0 ]);

      if(invert_x === true) pos[0] *= -1;
      if(invert_y === true) pos[1] *= -1;

      var len2 = vec3LengthSq(pos);
      if(len2 < 1)
        pos[2] = Math.sqrt(1 - len2);

      vec3.normalize(pos);

      return pos;
    }

    function onMouseDrag (e) {
      var off = getElementOffset(canvas)
        , x = e.clientX - off.x
        , y = e.clientY - off.y;

      var pos_from = getCanvasToSpherePnt(mouse_down_x, mouse_down_y);
      var pos_to = getCanvasToSpherePnt(x, y);
      var axis = vec3.cross(pos_to, pos_from, vec3.create());

      var current_rotation = quat4.create([
        axis[0], axis[1], axis[2], vec3.dot(pos_from, pos_to)
      ]);

      quat4.multiply(initial_rotation, current_rotation, rotation);
      quat4.normalize(rotation);

      arcball.trigger("change:rotation", this, rotation);
    }

    function onMouseUp (e) {
      document.removeEventListener("mousemove", onMouseDrag);
      document.removeEventListener("mouseup", onMouseUp);
    }

    function onMouseDown (e) {
      e.preventDefault();
      mouse_down_x = e.clientX;
      mouse_down_y = e.clientY;
      quat4.set(rotation, initial_rotation);
      document.addEventListener("mousemove", onMouseDrag);
      document.addEventListener("mouseup", onMouseUp, true);
    }

    function onMouseWheel (e) {
      e.preventDefault();
      // Gecko scroll events expose wheelDelta as detail
      var delta = e.detail * -2 || e.wheelDelta;
      arcball.setDistance(distance - delta * 0.001);
    }

    this.setDistance = function (d) {
      distance = utils.clamp(d, distance_min, distance_max);
    };

    this.getDistance = function () {
      return distance;
    };

    this.setRotation = function (q) {
      quat4.set(q, rotation);
    };

    this.getRotationMat3 = function () {
      return mat3.inverse(quat4.toMat3(rotation));
    };

    this.getModelView = function () {
      var r = quat4.inverse(rotation, Array(4));
      return mat4.fromRotationTranslation(r, [ 0.0, 0.0, -distance ]);
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousewheel", onMouseWheel);

    // Gecko has it's own mouse wheel event
    canvas.addEventListener("MozMousePixelScroll", onMouseWheel);
  };

  _.extend(Arcball.prototype, Backbone.Events);


  return Arcball;

});
