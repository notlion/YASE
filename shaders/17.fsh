void stepPos(in float i, in vec4 prevPos, in vec4 pos, out vec4 nextPos) {
  float t = 6.28*i / count;

  // 3-foil:
  //nextPos.xyz = 2.0*vec3( cos(2.*t)*(2.+cos(3.*t)), (2. + cos(3.*t))*sin(2.*t), sin(3.*t));

  // 8-knot:
  nextPos.xyz = vec3(
	cos(3.0*t)*(2.+cos(2.*t)),
	sin(3.0*t)*(2.+cos(2.*t)),
	sin(4.*t));

  float l = 0.5;
  float r = 0.5;

  float x = mod(time/15.0+(i/count),1.0)-0.5; x = x*x;
  float s = exp(-x/0.0004)*l+0.;
   x = mod(time/10.0+0.5+(i/count),1.0)-0.5; x = x*x;
  s+= exp(-x/0.0004)*r;
  vec3 N = (0.05+0.5*s)*rand3(i+mod(time,1.0));
  nextPos.xyz += N;
  N = normalize(N); // not really the normal, but close enough...
  vec3 L = normalize(vec3(0.0,0.0,1.0));
  vec3 H = normalize(cameraPos+L); // doesnt work
  nextPos.w = 0.1+0.5*clamp(dot(N,L),0.,1.0)
    +0.9*clamp(pow(max(dot(N,L),0.0),50.0),0.0,1.0);
}
