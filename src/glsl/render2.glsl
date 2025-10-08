precision highp float;

#include "./utils/hsv2Rgb.glsl"

uniform sampler2D uTexture;
uniform vec2 uTextureSize;
uniform float uTimeStep;
uniform float uColorStrength;

varying vec2 vUv;

// 計算結果をレンダリングする
void main() {

  vec2 uv0 = vUv;

  // vec2 uv0 = gl_FragCoord.xy * uTextureSize;
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
