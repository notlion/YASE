vec3 spring(in vec3 a, in vec3 b, in float len, in float power) {
  vec3 o = b - a;
  float m = length(o) + 0.00001;
  return (o / m) * power * (m - len);
}

void stepPos(in float i, in vec4 prevPos, in vec4 pos, out vec4 nextPos) {
	float	n = 5000.;
  float t = i / count, noc = n / count;
  float g = floor(t * n), gt = fract(t * n), omgt = 1. - gt;

	int ci = int(count), ii = int(i);

  // Step
  vec3 np = pos.xyz + (pos.xyz - prevPos.xyz) * 0.9;

	// Spring
  float jf, pwr = .01, len = 1. / (count / n) * 0.25;
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

	float r = 10.;

  nextPos.xyz = mix(np, rand3(g) * rand(g) * r, gt * 0.001);
  nextPos.w = gt * (1. - (length(nextPos.xyz) / r));
}
