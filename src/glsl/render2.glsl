precision highp float;

#include "./utils/hsv2Rgb.glsl"

uniform sampler2D uTexture;
uniform vec2 uTextureSize;
uniform float uTimeStep;

const float PI = 3.14159265358979323846;

void main() {
  vec2 uv0 = gl_FragCoord.xy * uTextureSize;
  vec2 uv = vec2(uv0.x, 1.0 - uv0.y);
  vec4 data = texture2D(uTexture, uv);

  float hueBase = fract(atan(data.y, data.x) * (1.0 / (2.0 * PI)));
  float tri = 1.0 - abs(hueBase * 2.0 - 1.0);
  float hue = tri * (1.0 / 6.0) + uTimeStep;

  float speed = length(data.xy);
  float sat = clamp(speed * 40.0, 0.3, 0.9);

  vec3 color = hsv2Rgb(hue, sat, 0.9);
  gl_FragColor = vec4(color, 1.0);
}
