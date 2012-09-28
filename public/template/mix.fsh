#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_position_left, u_position_right;
uniform float u_mix;

varying vec2 texcoord;

void main() {
  vec4 pl = texture2D(u_position_left, texcoord)
     , pr = texture2D(u_position_right, texcoord);
  gl_FragColor = mix(pl, pr, u_mix);
}
