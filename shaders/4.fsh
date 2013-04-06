void rX(inout vec3 p, float t) {
	float c = cos(t), s = sin(t); vec3 q = p;
	p.y = c * q.y - s * q.z;
	p.z = s * q.y + c * q.z;
}
void rY(inout vec3 p, float t) {
	float c = cos(t), s = sin(t); vec3 q = p;
	p.x = c * q.x + s * q.z;
	p.z = -s * q.x + c * q.z;
}
void rZ(inout vec3 p, float t) {
	float c = cos(t), s = sin(t); vec3 q = p;
	p.x = c * q.x - s * q.y;
	p.y = s * q.x + c * q.y;
}

vec3 grad(vec3 p, float d) {
  vec3 x = vec3(d, 0., 0.), y = vec3(0., d, 0.), z = vec3(0., 0., d);
  return vec3(
    noise(p + x) - noise(p - x),
    noise(p + y) - noise(p - y),
    noise(p + z) - noise(p - z)
  ) / (2. * d);
}

void stepPos(in float i, in vec4 prevPos, in vec4 pos, out vec4 nextPos) {
	float n = 128.;
  float e = floor(count / n);
  float j = floor(i / e);
  float k = mod(i, e);
  float t = k / e;
  float s = j / n;

	vec3 c = vec3(0.);//rand3(j) * sqrt(rand(j));
  float rad = .05 + s + mod(k * .1, 1.) * s * 0.4;
  vec3 p = vec3(rad, 0., 0.);
  rZ(p, rand(j + 1.) * PI * 2. - k * (1.1 - s) * 0.001 + time * 0.1);
  rX(p, rand(j) * PI * 2.);
  rY(p, rand(j + 10.) * PI * 2.);

  nextPos.xyz = p + c;
 	nextPos.w = 1. - t - length(p) * .5;
}
