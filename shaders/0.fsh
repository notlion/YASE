void stepPos(in float i, in vec4 prevPos, in vec4 pos, out vec4 nextPos) {
	float t = i / count;
  float d = 1000.;
  float f = mod(floor(frame + t * d), d);
  if(f == 0.)
    nextPos.xyz = vec3(0.);
  else if(f == 1.)
    nextPos.xyz = rand3(t + time, t + time + 100.) * 0.01;
  else
    nextPos.xyz = pos.xyz + (pos.xyz - prevPos.xyz);
  nextPos.w = pow(1. - f / d, 2.);
}