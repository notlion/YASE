'use strict';

var glmatrix = require("gl-matrix")
var mat4 = glmatrix.mat4;
var vec3 = glmatrix.vec3;
var quat = glmatrix.quat;

module.exports = Camera;

var kDegToRad = Math.PI / 180

function Camera(control) {
  this._control = control

  this.position = vec3.fromValues(0, 0, 5)
  this.positionVel = vec3.create()
  this.prevPosition = vec3.copy(vec3.create(), this.position)

  this.rotation = quat.create()
  this.rotationVel = quat.create()
  this.inverseRotation = quat.create()

  this.fovy = 60
  this.clipNear = 0.01
  this.clipFar = 100.0

  this.rotationSpeed = 0.0025
  this.rotationFriction = 0.05
  this.translationSpeed = 0.01
  this.translationFriction = 0.05

  this.locked = false
  this.orbitCenteringAlpha = 0.001
  this.orbitRotationFriction = 0.05

  this._orbitOrigin = vec3.fromValues(0, 0, 0)
  this._orbitDistance = 0

  control.on('change:sp.1.button.2', function(control, value) {
    if (value === 1) this.setLockedOrbit(!this.locked)
  }.bind(this))
}

Camera.prototype.setLockedOrbit = function(locked) {
  this.locked = locked
  if (locked) {
    this._orbitDistance = vec3.len(this.position)
  }
}

Camera.prototype.step = (function() {
  var tTranslation = vec3.create()
  var tRotation = quat.create()

  var kQuatIdentity = quat.create()

  var tViewDir = vec3.create()
  var tOriDir = vec3.create()
  var tTowardOriAxis = vec3.create()
  var tTowardOriRotation = quat.create()

  var zNegAxis = vec3.fromValues(0, 0, -1)

  return function(time, delta) {
    var fovy = this._control.get('fov.x')
    if (fovy) this.fovy = fovy;

    var p = this.position
    var pv = this.positionVel
    var rv = this.rotationVel

    // Translation
    vec3.sub(pv, p, this.prevPosition) // Verlet velocity
    if (this.locked) {

    }
    else {
      vec3.scale(pv, pv, 1 - this.translationFriction)
      var pacc = this._control.get('sp.1.trans.xyz')
      if (pacc) {
        vec3.set(tTranslation, pacc[0] - 0.5, -(pacc[2] - 0.5), pacc[1] - 0.5)
        vec3.scale(tTranslation, tTranslation, this.translationSpeed)
        vec3.transformQuat(tTranslation, tTranslation, this.inverseRotation);
        vec3.add(pv, pv, tTranslation)
      }
    }
    vec3.copy(this.prevPosition, p)
    vec3.add(this.position, p, pv)

    // Maintain the same distance as when locked.
    // if (this.locked) {
    //   vec3.normalize(p, p)
    //   vec3.scale(p, p, this._orbitDistance)
    // }

    // Rotation
    if (this.locked) {
      // Slow down
      quat.slerp(rv, rv, kQuatIdentity, this.orbitRotationFriction)
      // Center
      vec3.sub(tOriDir, this._orbitOrigin, p)
      vec3.transformQuat(tOriDir, tOriDir, this.rotation)
      vec3.normalize(tOriDir, tOriDir)
      quat.rotationTo(tTowardOriRotation, tOriDir, zNegAxis)
      quat.slerp(rv, rv, tTowardOriRotation, this.orbitCenteringAlpha)
    }
    else {
      // Slow down
      quat.slerp(rv, rv, kQuatIdentity, this.rotationFriction)
      // Accelerate
      var racc = this._control.get('sp.1.rot.xyz');
      var rs = this.rotationSpeed
      if (racc) {
        quat.identity(tRotation)
        quat.rotateX(tRotation, tRotation, (racc[0] - 0.5) * rs * -2)
        quat.rotateY(tRotation, tRotation, (racc[2] - 0.5) * rs * 2)
        quat.rotateZ(tRotation, tRotation, (racc[1] - 0.5) * rs * -2)
        quat.mul(rv, tRotation, rv)
      }
    }
    quat.mul(this.rotation, rv, this.rotation)
    quat.invert(this.inverseRotation, this.rotation)
  }
})()

Camera.prototype.calcModelView = (function() {
  var tNegPos = vec3.create()
  return function(out) {
    vec3.scale(tNegPos, this.position, -1)
    mat4.fromQuat(out, this.rotation)
    mat4.translate(out, out, tNegPos)
  }
})()

Camera.prototype.calcProjection = function(out, w, h) {
  var rfovy = kDegToRad * this.fovy;
  mat4.perspective(out, rfovy, w / h, this.clipNear, this.clipFar);
}
