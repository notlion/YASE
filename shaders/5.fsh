vec3 spring(in vec3 a, in vec3 b, in float len, in float power) {
  vec3 o = b - a;
  float m = length(o);
  return o / m * power * (m - len);
}

void stepPos(in float i, in vec4 prevPos, in vec4 pos, out vec4 nextPos) {
	float t = i / count;
  float n = 1000.;
  float d = 5000.;
  float s = pos.w + floor(t * n) / n;
  float f = mod(frame - t * (n * (d / n)), d);

  nextPos.xyz = pos.xyz + spring(pos.xyz, rand3(s, s + 10.), 0., 0.075 + 0.05 * fract(f));

  if(floor(f) == 0.){
    if(pos.w >= 1.)
      nextPos.w = pos.w - .5;
    else
    	nextPos.w = pos.w + .101;
  }
  else if(mod(frame, 1000.) == 0.)
    nextPos.w = 1.;
  else
    nextPos.w = pos.w;
}
