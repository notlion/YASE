#define shadows 1

vec3 spring(in vec3 a, in vec3 b, in float len, in float power) {
  vec3 o = b - a;
  float m = length(o) + 0.00001;
  return (o / m) * power * (m - len);
}

void stepPos(in float i, in vec4 prevPos, in vec4 pos, out vec4 nextPos) {
	float	n = 4000.;
  float t = i / count, noc = n / count;
  float g = floor(t * n), gt = fract(t * n), omgt = 1. - gt;

	int ci = int(count), ii = int(i);

  // Step
  vec3 np = pos.xyz + (pos.xyz - prevPos.xyz) * 0.9;

  //np += spring(pos.xyz, vec3(0.), 1., 0.1);

	// Spring
  float jf, pwr = .01, len = 1. / (count / n) * 2.;
  vec3 p;
  for(int j = 1; j < 8; ++j) {
    jf = float(j);
    if(ii - j > 0 && floor((i - jf) * noc) == g) {
      p = getPos(i - jf).xyz;
    	np += spring(pos.xyz, p, len * jf, pwr);
    }
    if(ii + j < ci - 1 && floor((i + jf) * noc) == g) {
      p = getPos(i + jf).xyz;
    	np += spring(pos.xyz, p, len * jf, pwr);
    }
  }

  // Turbulence
  vec3 npos = pos.xyz + (time + gt) * 0.2;
  np += vec3(noise(npos), noise(npos + 15.), noise(npos + 18.)) * 0.001;

  nextPos.xyz = mix(rand3(g + floor(frame / 500.)) * omgt * 2., np, 1. - gt * gt * 0.05);
  nextPos.w = (getShadow(pos.xyz + rand3(t) * 0.025, 10.)
    				+ getShadow(pos.xyz + rand3(t + 1.) * 0.025, 10.)) * .5;;
}
