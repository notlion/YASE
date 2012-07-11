precision highp float;

uniform sampler2D u_position;

varying vec2 texcoord;

void main(){
  gl_FragColor = texture2D(u_position, texcoord);
}
