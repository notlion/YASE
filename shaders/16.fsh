#define sim_res 512

const float energy = 0.75;
const float attraction = 0.05;
const float flowPower = 0.002;
const float spinPower = 0.001;

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

float sdBox(vec3 p, vec3 b) {
  vec3 d = abs(p) - b;
  return min(max(d.x, max(d.y, d.z)), 0.) + length(max(d, 0.));
}
float sdSphere(vec3 p, float s) {
  return length(p) - s;
}
float opU(float d1, float d2) { return min(d1,d2); }
float opS(float d1, float d2) { return max(-d1, d2); }
float opI(float d1, float d2) { return max(d1,d2); }

// Change this.
float dist(vec3 p) {
  vec3 ip = floor(p);
  vec3 fp = fract(p) - .5;
  float tm = time * .1;
  float tp = PI * 2.;
  fp += rand3(ip.x + ip.y + ip.z) * 0.1;
  rX(fp, rand(ip.x) * tp + tm);
  rY(fp, rand(ip.y) * tp + tm);
  rZ(fp, rand(ip.z) * tp + tm);
  return sdBox(fp, vec3(0.2));
}

vec3 grad(vec3 p, float d) {
  vec3 x = vec3(d, 0., 0.), y = vec3(0., d, 0.), z = vec3(0., 0., d);
  return vec3(
    dist(p + x) - dist(p - x),
    dist(p + y) - dist(p - y),
    dist(p + z) - dist(p - z)
  ) / (2. * d);
}

vec3 flow(vec3 p, float d) {
  vec3 x = vec3(d, 0., 0.), y = vec3(0., d, 0.), z = vec3(0., 0., d);
  return vec3(
    noise(p + x) - noise(p - x),
    noise(p + y) - noise(p - y),
    noise(p + z) - noise(p - z)
  ) / (2. * d);
}

void stepPos(in float i, in vec4 prevPos, in vec4 pos, out vec4 nextPos) {
	// Clear
  if (frame == 0.) { nextPos = vec4(0.); return; }
  if (frame == 1.) { nextPos = vec4(rand3(i) * 0.2, 1.); return; }

  float t = i / count;
  vec3 p = pos.xyz;
  vec3 vel = (p - prevPos.xyz) * energy;

  vec3 g = grad(p, 0.01);
  float lg = length(g);
  float phi = dist(p);
	vel -= attraction * phi * g / (lg * lg);

  //vel += vec3(-p.y, p.x, 0.) * spinPower;
  vel += flowPower * flow(p + t * 100. + time * 0.25, 0.01) * 0.05;
  vel += rand3(i + time) * 0.0005;

  nextPos.xyz = p + vel;
  nextPos.w = abs(phi) * 80.;
}
