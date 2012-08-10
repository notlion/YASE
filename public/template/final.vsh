uniform mat4 u_mvp, u_light_mvp;
uniform sampler2D u_position, u_shadow_depth;
uniform float u_point_size;

attribute vec2 a_texcoord;

varying vec4 v_color;

void main() {
  vec4 t = texture2D(u_position, a_texcoord);
  vec4 p = vec4(t.xyz, 1.);

  gl_Position = u_mvp * p;
  gl_PointSize = u_point_size;

  vec4 dp = u_light_mvp * p;
  float depth = texture2D(u_shadow_depth, (dp.xy + 1.) * .5).x;

  float shadow = clamp(exp(-10. * (dp.z - depth)), 0., 1.);

  v_color = vec4(t.www * shadow, 1.);
}
