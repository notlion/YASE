'use strict';

var glmatrix = require("gl-matrix")
var mat4 = glmatrix.mat4;
var vec3 = glmatrix.vec3;
var quat = glmatrix.quat;

module.exports = Camera;

var kDegToRad = Math.PI / 180

function Camera(control) {
  this.control = control

  this.position = vec3.fromValues(0, 0, 5)
  this.positionVel = vec3.create()

  this.rotation = quat.create()
  this.rotationVel = quat.create()
  this.inverseRotation = quat.create()

  this.fovy = 60
  this.clipNear = 0.01
  this.clipFar = 100.0

  this.rotationSpeed = 0.005
  this.rotationFriction = 0.05
  this.translationSpeed = 0.02
  this.translationFriction = 0.05
}

var tTranslation = vec3.create()
var tRotation = quat.create()
var tQuatIdentity = quat.create()

Camera.prototype.step = function(time, delta) {
  var fovy = this.control.get('fov.x')
  if (fovy) this.fovy = fovy;

  vec3.scale(this.positionVel, this.positionVel, 1 - this.translationFriction)
  var pacc = this.control.get('sp.1.trans.xyz')
  if (pacc) {
    vec3.set(tTranslation, pacc[0] - 0.5, -(pacc[2] - 0.5), pacc[1] - 0.5)
    vec3.scale(tTranslation, tTranslation, this.translationSpeed)
    vec3.transformQuat(tTranslation, tTranslation, this.inverseRotation);
    vec3.add(this.positionVel, this.positionVel, tTranslation)
  }
  vec3.add(this.position, this.position, this.positionVel);

  var rv = this.rotationVel
  quat.slerp(rv, rv, tQuatIdentity, this.rotationFriction)
  var racc = this.control.get('sp.1.rot.xyz');
  var rs = this.rotationSpeed
  if (racc) {
    quat.identity(tRotation)
    quat.rotateX(tRotation, tRotation, (racc[0] - 0.5) * rs * -2)
    quat.rotateY(tRotation, tRotation, (racc[2] - 0.5) * rs * 2)
    quat.rotateZ(tRotation, tRotation, (racc[1] - 0.5) * rs * -2)
    quat.mul(rv, tRotation, rv)
  }
  quat.mul(this.rotation, rv, this.rotation)
  quat.invert(this.inverseRotation, this.rotation)
}

var tNegPos = vec3.create()

Camera.prototype.calcModelView = function(out) {
  vec3.scale(tNegPos, this.position, -1)
  mat4.fromQuat(out, this.rotation)
  mat4.translate(out, out, tNegPos)
}

Camera.prototype.calcProjection = function(out, w, h) {
  var rfovy = kDegToRad * this.fovy;
  mat4.perspective(out, rfovy, w / h, this.clipNear, this.clipFar);
}
