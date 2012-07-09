precision highp float;

uniform sampler2D amp_left, amp_right;
uniform float aspect, time, progress;
uniform vec2 mouse, resolution;
varying vec2 texcoord;

float ampLeft(float x){
  return texture2D(amp_left, vec2(x, 0.)).x;
}
float ampRight(float x){
  return texture2D(amp_right, vec2(x, 0.)).x;
}

float rand(vec2 p){
  return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
}
float rand(float p){
  return fract(sin(dot(p, 12.9898)) * 43758.5453);
}

#define PI 3.141592653589793
#define TWOPI 6.283185307179586

<%= src_fragment %>

void main(){
  gl_FragColor = vec4(pixel(texcoord), 1.);
}
