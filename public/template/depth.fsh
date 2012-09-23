#ifdef GL_ES
precision highp float;
#endif

varying float v_linear_depth;

void main() {
  gl_FragColor = vec4(v_linear_depth);
}
