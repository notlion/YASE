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

  vec4 lp = u_light_mvp * p;
  float shadow_depth = texture2D(u_shadow_depth, (lp.xy + 1.) * .5).x;

  float shadow = clamp(exp(-20. * (lp.z - shadow_depth)), 0., 1.);

  t.w *= shadow;

  v_color = vec4(t.w, t.w, t.w, 1.);
}
