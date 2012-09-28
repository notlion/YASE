void stepPos(in float i, in vec4 prevPos, in vec4 pos, out vec4 nextPos) {
	float n = 64., n2 = n * n, n3 = n * n * n;
  float t = i / count;
  vec3 p = vec3(mod(i, n) / n, mod(i, n2) / n2, mod(i, n3) / n3);
  p = (p - .5) * 10.;
  float sc = .5;
  float sp = .5;
	float noi = noise(p * sc + time * sp);
  noi += noise(p * sc * sc + time * sp * sp);
  nextPos.xyz = p;
  nextPos.w = clamp(mix(-10., 1., noi), 0., 1.);
}