#define track http://soundcloud.com/kryptic-minds/kryptic-minds-studio-mix-for
#define smoothing .75
#define pixel_scale 2

vec3 pixel(vec2 pos) {
  float amp_l = ampLeft(pos.x);
  float amp_r = ampRight(1. - pos.x);

  // Draw Frequency Spectrum
  vec3 color = vec3(0.);
  color.r = float(amp_l > pos.y) * (pos.y / amp_l);
  color.b = float(amp_r > pos.y) * (pos.y / amp_r);
  color.g = (color.r + color.b) * .5;

  // Draw Progress
  vec2 p = (pos - vec2(1., 0.)) * vec2(-aspect, -1.) - vec2(.1, -.1);
  float r = length(p) / .05;
  float t = (atan(p.x, p.y) + PI) / (PI * 2.);
  if(r < 1.)
    return vec3(float(progress > t) * (t / progress) * r) + .07;

  return color;
}
