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
      , touch_id = -1
      , invert_x = false
      , invert_y = true
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
      var off = getElementOffset(canvas);
      var x = e.clientX - off.x;
      var y = e.clientY - off.y;
      arcball.drag(x, y);
    }

    function onMouseUp (e) {
      document.removeEventListener("mousemove", onMouseDrag);
      document.removeEventListener("mouseup", onMouseUp);
    }

    function onMouseDown (e) {
      e.preventDefault();
      arcball.down(e.clientX, e.clientY);
      document.addEventListener("mousemove", onMouseDrag);
      document.addEventListener("mouseup", onMouseUp, true);
    }

    function onMouseWheel (e) {
      e.preventDefault();
      // Gecko scroll events expose wheelDelta as detail
      var delta = e.detail * -2 || e.wheelDelta;
      arcball.setDistance(distance - delta * 0.001);
      arcball.trigger("change:distance", this, distance);
    }

    function onTouchStart (e) {
      if (touch_id < 0) {
        e.preventDefault();
        var touch = e.changedTouches[0];
        touch_id = touch.identifier;
        arcball.down(touch.clientX, touch.clientY);
        canvas.addEventListener("touchmove", onTouchMove);
        canvas.addEventListener("touchend", onTouchEnd);
        canvas.addEventListener("touchcancel", onTouchEnd);
        canvas.addEventListener("touchleave", onTouchEnd);
      }
    }

    function onTouchMove (e) {
      for(var touch, i = e.changedTouches.length; --i >= 0;) {
        touch = e.changedTouches[i];
        if(touch.identifier === touch_id) {
          arcball.drag(touch.clientX, touch.clientY);
          break;
        }
      }
    }

    function onTouchEnd (e) {
      for(var touch, i = e.changedTouches.length; --i >= 0;) {
        touch = e.changedTouches[i];
        if(touch.identifier === touch_id) {
          touch_id = -1;
          canvas.removeEventListener("touchmove", onTouchMove);
          canvas.removeEventListener("touchend", onTouchEnd);
          canvas.removeEventListener("touchcancel", onTouchEnd);
          canvas.removeEventListener("touchleave", onTouchEnd);
        }
      }
    }

    this.down = function (x, y) {
      mouse_down_x = x;
      mouse_down_y = y;
      quat4.set(rotation, initial_rotation);
    }

    this.drag = function (x, y) {
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

    this.getModelView = function (dest) {
      var r = quat4.inverse(rotation, Array(4));
      return mat4.fromRotationTranslation(r, [ 0.0, 0.0, -distance ], dest);
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("touchstart", onTouchStart);
    canvas.addEventListener("mousewheel", onMouseWheel);

    // Gecko has it's own mouse wheel event
    canvas.addEventListener("MozMousePixelScroll", onMouseWheel);
  };

  _.extend(Arcball.prototype, Backbone.Events);


  return Arcball;

});
