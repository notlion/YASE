vec2 rotate(vec2 v, in float t) {
  float ct = cos(t);
  float st = sin(t);
 	return vec2(v.x * ct - v.y * st, v.x * st + v.y * ct);
}

void stepPos(in float i, in vec4 prevPos, in vec4 pos, out vec4 nextPos) {
	float n = 16., n1 = n - 1.;
  float ea = floor(count / n);
  float j = mod(i, ea);
  float k = mod(j, 2.) - 1.;
  float t = i / count;

  vec2 p;
  p.x = j / ea * 2. - 1.;
  p.y = floor(t * n) / n1 * 2. - 1.;

  p.xy = rotate(p.xy, PI * (k * .5 + .25));

  float sc = max(0., 1.5 - length(p)) * .5;
  float ns = noise(p.x, p.y + time * .1, 0.);

  nextPos.xy = p;
  nextPos.z = ns * sc;
  nextPos.w = smoothstep(-sc, sc, nextPos.z);
}
