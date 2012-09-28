vec3 spring(in vec3 a, in vec3 b, in float len, in float power) {
  vec3 o = b - a;
  float m = length(o);
  return o / m * power * (m - len);
}

void stepPos(in float i, in vec4 prevPos, in vec4 pos, out vec4 nextPos) {
	float t = i / count;
  float n = 1000.;
  float d = 1000.;
  float s = pos.w + floor(t * n) / n;
  float f = mod(frame - t * (n * (d / n)), d);

  vec3 v = (pos.xyz - prevPos.xyz) * 0.95;
  vec3 g = rand3(s, s + 10.) * sqrt(rand(s + 20.));
  nextPos.xyz = pos.xyz + v + spring(pos.xyz, g, 0., 0.0075 + 0.005 * fract(f));

  if(floor(f) == 0.){
    nextPos.xyz += normalize(pos.xyz) * 0.05;
    if(pos.w >= 1.)
      nextPos.w = pos.w - .5;
    else
    	nextPos.w = pos.w + .101;
  }
  else
    nextPos.w = pos.w;
}
