void stepPos(in float i, in vec4 prevPos, in vec4 pos, out vec4 nextPos) {
	float sc = .5;
  float h = .5;
  nextPos.xy = (texcoord - .5) * 5.;
  nextPos.z = noise(nextPos.x * sc, nextPos.y * sc, time * 0.1) * h;
  nextPos.w = nextPos.z + 0.5;
}
