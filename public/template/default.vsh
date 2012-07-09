attribute vec3 a_position;
attribute vec2 a_texcoord;

varying vec2 texcoord;

void main(){
  texcoord = a_texcoord;
  gl_Position = vec4(a_position, 1.);
}
