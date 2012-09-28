vec2 rot(in vec2 p, float t) {
  float st = sin(t), ct = cos(t);
  return vec2(p.x * ct - p.y * st, p.x * st + p.y * ct);
}

void stepPos(in float i, in vec4 prevPos, in vec4 pos, out vec4 nextPos) {
	float t = i / count;
  nextPos.xy = vec2(0.);
  float r = floor(rand(t * time) * 3.);
  if(r == 0.)
    nextPos.xy += vec2(1.8, 1.);
  else if(r == 1.)
    nextPos.xy += vec2(-1.8, 1.);
  else
    nextPos.y -= 2.;
  nextPos.xy = getPos(i - 1.).xy + rot(nextPos.xy, 0.);
  nextPos.xy *= -.5;
	nextPos.z = 0.;
  nextPos.w = 1.;
}
