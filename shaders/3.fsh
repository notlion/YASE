#define shadows 1

void stepPos(in float i, in vec4 prevPos, in vec4 pos, out vec4 nextPos) {
	float t = i / count;
  float d = 1000.;
  float f = floor(mod(frame + t * d, d));
  float fy = -2.;
  float s = t * time;
  vec3 v = vec3(pos.xyz - prevPos.xyz) * 0.99;
  if(f == 0.) { // Emit
    nextPos.xyz = vec3(0., 0., 2.);
  }
  else if(f == 1.) { // Initial Step
    float th = floor(t * abs(sin(time * .1)) * 500.);
    nextPos.xyz = pos.xyz + rand3(s, s + 10.) * rand(s) * 0.01;
    nextPos.z += sin(th * 6.) * 0.025 + 0.025;
    nextPos.x += sin(th) * 0.025;
    nextPos.y += cos(th) * 0.025;
  }
  else if(pos.z < fy) { // Collide with floor
    v.z *= -1.;
    v += rand3(s, s + 10.) * v.z * 0.1;
    nextPos.xyz = pos.xyz + v;
  }
  else { // Just step
    nextPos.xyz = pos.xyz + v;
    nextPos.z -= 0.001;
  }

  // Set color to shadow brightness
  nextPos.w = getShadow(pos.xyz, 10.);
}