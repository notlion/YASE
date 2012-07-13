void stepPos(in float t, in vec4 prevPos, in vec4 pos, out vec4 nextPos) {
  float t1 = t * 200.;
  nextPos.xyz = vec3(sin(t1) * t * 10., cos(t1) * t * 10., 0.);
  nextPos.w = pos.w;
}
