'use strict';

var easing = require('./easing')
var glmatrix = require('gl-matrix')
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
  this.orbitCenteringAlpha = 0.002
  this.orbitDistanceAlpha = 0.1
  this.orbitRotationFriction = 0.05
  this.orbitTransitionSpeed = 0.0025

  control.on('change:sp.1.button.2', function(control, value) {
    if (value === 1) this.setLockedOrbit(!this.locked)
  }.bind(this))
}

Camera.prototype.setLockedOrbit = function(locked) {
  this.locked = locked
  if (locked) {
    this._orbitTransition = 0
    this._orbitOrigin = vec3.fromValues(0, 0, 0)
    this._orbitSpeed = vec3.len(this.positionVel)
  }
}

Camera.prototype.step = (function() {
  var tTranslation = vec3.create()
  var tRotation = quat.create()

  var kQuatIdentity = quat.create()

  var tOrbitVel = vec3.create()

  var tOriDir = vec3.create()
  var tTowardOriRotation = quat.create()

  var zNegAxis = vec3.fromValues(0, 0, -1)

  return function(time, delta) {
    var fovy = this._control.get('fov.x')
    if (fovy) this.fovy = fovy;

    var p = this.position
    var pv = this.positionVel
    var rv = this.rotationVel

    var orbitTransAlpha = easing.cubicInOut(this._orbitTransition)
    var alpha;

    // Setup Translation
    if (this.locked) {
      if (orbitTransAlpha < 1) {
        this._orbitDistance = vec3.len(this.position)
      }
      vec3.normalize(tOrbitVel, pv)
      vec3.scale(tOrbitVel, tOrbitVel, this._orbitSpeed)
      vec3.add(tOrbitVel, tOrbitVel, p)
      vec3.normalize(tOrbitVel, tOrbitVel)
      vec3.scale(tOrbitVel, tOrbitVel, this._orbitDistance)
      vec3.sub(tOrbitVel, tOrbitVel, p)
      alpha = orbitTransAlpha * this.orbitDistanceAlpha
      vec3.lerp(pv, pv, tOrbitVel, alpha)
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

    // Setup Rotation
    if (this.locked) {
      // Slow down
      quat.slerp(rv, rv, kQuatIdentity, this.orbitRotationFriction)
      // Center
      vec3.sub(tOriDir, this._orbitOrigin, p)
      vec3.transformQuat(tOriDir, tOriDir, this.rotation)
      vec3.normalize(tOriDir, tOriDir)
      quat.rotationTo(tTowardOriRotation, tOriDir, zNegAxis)
      alpha = orbitTransAlpha * this.orbitCenteringAlpha
      quat.slerp(rv, rv, tTowardOriRotation, alpha)
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

    // Modify Position.
    vec3.copy(this.prevPosition, p)
    vec3.add(p, p, pv)

    // Calculate velocity for next frame.
    vec3.sub(pv, p, this.prevPosition)

    // Modify Rotation.
    quat.mul(this.rotation, rv, this.rotation)
    quat.invert(this.inverseRotation, this.rotation)

    // Step the transition.
    if (this.locked) {
      this._orbitTransition += this.orbitTransitionSpeed
      this._orbitTransition = Math.min(1, this._orbitTransition)
    }
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
