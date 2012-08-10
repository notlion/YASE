uniform mat4 u_projection, u_modelview;
uniform float u_point_size;
uniform sampler2D u_position;

attribute vec2 a_texcoord;

varying float v_linear_depth;

void main() {
  vec4 ndc = u_projection * u_modelview * vec4(texture2D(u_position, a_texcoord).xyz, 1.);

  v_linear_depth = ndc.z;

  gl_PointSize = u_point_size;
  gl_Position = ndc;
}
