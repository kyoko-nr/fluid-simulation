// HSVをRGBに変換
vec3 hsv2Rgb(float h, float s, float v) {
  vec3 k = vec3(0.0, 2.0, 1.0) / 3.0 + h;
  vec3 c = clamp(abs(fract(k) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
  return ((c - 1.0) * s + 1.0) * v;
}
