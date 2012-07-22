precision highp float;

uniform sampler2D position, position_prev, index, amp_left, amp_right;
uniform float aspect, time, frame, progress;
uniform vec2 mouse, resolution;

varying vec2 texcoord;

#define PI 3.141592653589793
#define TWOPI 6.283185307179586

float ampLeft(float x) {
  return texture2D(amp_left, vec2(x, 0.)).x;
}
float ampRight(float x) {
  return texture2D(amp_right, vec2(x, 0.)).x;
}

float rand(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
}
float rand(float x) {
  return rand(vec2(x, 0.));
}
vec3 rand3(float x, float y) {
  float phi = rand(x) * PI * 2.;
  float ct = rand(y) * 2. - 1.;
  float rho = sqrt(1. - ct * ct);
  return vec3(rho * cos(phi), rho * sin(phi), ct);
}

<%= src_fragment %>

void main() {
  vec4 t = texture2D(index, texcoord)
     , p = texture2D(position, texcoord)
     , pp = texture2D(position_prev, texcoord);
  stepPos(t.r, pp, p, gl_FragColor);
}
