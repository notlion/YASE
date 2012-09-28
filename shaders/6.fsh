void stepPos(in float i, in vec4 prevPos, in vec4 pos, out vec4 nextPos) {
	float t = i / count;
  float t1 = t * 500.;
  nextPos.x = sin(t1) * t * 10.;
  nextPos.y = cos(t1) * t * 10.;
  nextPos.z = t * (noise(t, time * 0.5, t1) + sin(t1 * 10. + time));
  nextPos.w = nextPos.z;
}
