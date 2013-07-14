'use strict';

var Backbone = require("backbone")
  , _        = require("underscore")


function vec3LengthSq (vec) {
  var x = vec[0], y = vec[1], z = vec[2]
  return x * x + y * y + z * z
}


function Arcball() {
  var rotation = quat4.create([ 0, 0, 0, 1 ])
    , invert_x = false, invert_y = false

  function getSpherePnt (x, y) {
    var pos = vec3.create([ x, y, 0 ])

    if(invert_x) pos[0] *= -1
    if(invert_y) pos[1] *= -1

    var len2 = vec3LengthSq(pos)
    if(len2 < 1)
      pos[2] = Math.sqrt(1 - len2)

    vec3.normalize(pos)

    return pos
  }

  this.distance = 5

  this.pan = function (x, y) {
    var pos_from = getSpherePnt(0, 0)
    var pos_to = getSpherePnt(x, y)
    var axis = vec3.cross(pos_to, pos_from, vec3.create())

    var current_rotation = quat4.create([
      axis[0], axis[1], axis[2], vec3.dot(pos_from, pos_to)
    ])

    quat4.multiply(rotation, current_rotation)
    quat4.normalize(rotation)

    this.trigger("change:rotation", this, rotation)
  }

  this.setRotation = function (q) {
    quat4.set(q, rotation)
  }

  this.getRotationMat3 = function() {
    return mat3.inverse(quat4.toMat3(rotation))
  }

  this.getModelView = function (dest) {
    var r = quat4.inverse(rotation, Array(4))
    return mat4.fromRotationTranslation(r, [ 0, 0, -this.distance ], dest)
  }
}

_.extend(Arcball.prototype, Backbone.Events)


module.exports = Arcball
