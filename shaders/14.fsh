vec2 rot(in vec2 p, float t) {
  float st = sin(t), ct = cos(t);
  return vec2(p.x * ct - p.y * st, p.x * st + p.y * ct);
}

void stepPos(in float i, in vec4 prevPos, in vec4 pos, out vec4 nextPos) {
	float t = i / count;
	float r = floor(rand(t * time) * 3.);
	float scale = 1.;
  float t1 = time * .5;
  float t2 = time * 1.;
  if(r == 0.){
    prevPos.xy += vec2(sin(t1), cos(t1 * 2.1));
    prevPos.xy = rot(prevPos.xy, t2);
  }else if(r == 1.){
    prevPos.xy += vec2(scale * cos(t1 * 3.12), scale * sin(t1 * 4.14));
    prevPos.xy = rot(prevPos.xy, 0.);
  }else if(r == 2.){ 
    prevPos.xy += vec2(scale * sin(t1 * 5.16), scale * cos(t1 * 6.18));
    prevPos.xy = rot(prevPos.xy, -t2);
  }
  prevPos.xyz *= .5;
  prevPos.w = 1.;

  nextPos = prevPos;
}