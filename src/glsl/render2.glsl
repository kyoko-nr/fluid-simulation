precision highp float;

#include "./utils/hsv2Rgb.glsl"

uniform sampler2D uTexture;
uniform vec2 uTextureSize;
uniform float uTimeStep;
uniform float uColorStrength;

const float PI = 3.14159265358979323846;

// 計算結果をレンダリングする
void main() {
  // vec2 uv0 = gl_FragCoord.xy * uTextureSize;
  // vec2 uv = vec2(uv0.x, 1.0 - uv0.y);

  // // data.xyに速度、data.zに圧力、data.wに発散が入っている
  // vec4 data = texture2D(uTexture, uv);

  // float hueBase = fract(atan(data.y, data.x) * (1.0 / (2.0 * PI)));
  // float tri = 1.0 - abs(hueBase * 2.0 - 1.0);
  // float hue = tri * (1.0 / 6.0) + uTimeStep;

  // float speed = length(data.xy);
  // float sat = clamp(speed * 40.0, 0.3, 0.9);

  // vec3 color = hsv2Rgb(hue, sat, 0.9);
  // gl_FragColor = vec4(color, 1.0);

  vec2 uv0 = gl_FragCoord.xy * uTextureSize;
  vec2 uv = vec2(uv0.x, 1.0 - uv0.y);

  // sample/fluid-three の color.frag に合わせた可視化
  vec2 vel = texture2D(uTexture, uv).xy;
  float len = length(vel);
  vel = vel * 0.5 + 0.5;

  vec3 color = vec3(vel.x, vel.y, 1.0);
  float w = clamp(len * uColorStrength, 0.0, 1.0);
  color = mix(vec3(1.0), color, w);

  gl_FragColor = vec4(color, 1.0);
}
