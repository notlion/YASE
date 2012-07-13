uniform mat4 u_mvp;
uniform sampler2D u_position;

attribute vec2 a_texcoord;

varying vec4 v_color;

void main() {
  vec4 t = texture2D(u_position, a_texcoord);
  gl_Position = u_mvp * vec4(t.xyz, 1.);
  gl_PointSize = 2.;
  v_color = vec4(t.w, t.w, t.w, 1.);
}
