void stepPos(in float i, in vec4 prevPos, in vec4 pos, out vec4 nextPos) {
	float t = i / count;
  float t1 = t * 500.;
  float tpi = t * PI;
  nextPos.x = sin(t1) * sin(tpi);
  nextPos.y = cos(t1) * sin(tpi);
  nextPos.z = cos(tpi);
  nextPos.w = (sin(tpi + time) + 1.) * .5;
}
