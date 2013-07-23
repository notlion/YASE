const vec3
  X = vec3(1., 0., 0.),
  Y = vec3(0., 1., 0.),
	Z = vec3(0., 0., 1.);

const float noisePower = 0.0;
const float noiseScale = 0.1;
const float noiseSpeed = 0.025;

float hash(float n) { return fract(sin(n)*43758.5453123); }
float fnoise(in vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f*f*(3.0-2.0*f);
  float n = p.x + p.y*157.0 + 113.0*p.z;
  return mix(mix(mix(hash(n+  0.0), hash(n+  1.0),f.x),
                 mix(hash(n+157.0), hash(n+158.0),f.x),f.y),
             mix(mix(hash(n+113.0), hash(n+114.0),f.x),
                 mix(hash(n+270.0), hash(n+271.0),f.x),f.y),f.z) * 2. - 1.;
}

float fbm(in vec3 p) {
 	float v = 0.;
	float amp = .5;
	for (int i = 0; i < 4; i++) {
		v += fnoise(p) * amp;
		p *= 2.;
		amp *= .5;
	}
	return v;
}

vec3 grad(in vec3 p, in float d) {
  return vec3(
    fbm(p + X * d) - fbm(p - X * d),
    fbm(p + Y * d) - fbm(p - Y * d),
    fbm(p + Z * d) - fbm(p - Z * d)
  ) / (2. * d);
}

vec3 spring(in vec3 a, in vec3 b, in float len, in float power) {
  vec3 o = b - a;
  float m = length(o) + .000001;
  return (o / m) * power * (m - len);
}

void stepPos(in float i, in vec4 prevPos, in vec4 pos, out vec4 nextPos) {
	float n = 128., n1 = n - 1.;
  float ea = floor(count / n);
  float j = mod(i, ea);
  float k = mod(j, 2.) * 2. - 1.;
  float t = i / count;

  vec3 p = vec3(j / ea * 2. - 1., floor(t * n) / n1 * 2. - 1., 0.);
  p.x += rand(p.y) - .5;
  p.xy = k == 1. ? p.yx : p.xy;

  vec3 v = vec3(0., 0., time * noiseSpeed);
  vec3 o = grad(v + p * noiseScale, 0.05);
  float pl = length(p);
  o *= smoothstep(2., 0., pl);
  float ol = length(o);
 	p += o * noisePower;

  float bt = time * .1 * (float(rand(floor(i / ea)) < .5) * 2. - 1.);
	float b = fnoise(vec3(t * 500. + bt, 0., 0.));

  bool on = b > 0.;
  nextPos.xyz = p;
  nextPos.w = float(on) * ol * 0.8;

  if (!on) nextPos.xyz = vec3(0.);
}