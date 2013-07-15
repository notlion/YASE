#define MIN_POINT_SIZE 2.0
#define MAX_POINT_SIZE 10.0

uniform mat4 u_modelview, u_projection;
uniform sampler2D u_position;
uniform float u_point_size;
uniform float u_screen_width;

attribute vec2 a_texcoord;

varying vec4 v_color;

void main() {
  vec4 t = texture2D(u_position, a_texcoord);

  vec4 eyePos = u_modelview * vec4(t.xyz, 1.);
  vec4 projPos = u_projection * vec4(u_point_size, u_point_size, eyePos.z, eyePos.w);
  gl_PointSize = clamp(
    u_screen_width * projPos.x / projPos.w,
    MIN_POINT_SIZE,
    MAX_POINT_SIZE
  );
  gl_Position = u_projection * eyePos;

  v_color = vec4(t.www, 1.);
}
