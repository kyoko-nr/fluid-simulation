precision highp float;

#include "./utils/sampleNeighborVelocityReflect.glsl"

uniform sampler2D uData;
uniform vec2 uTexelSize;
uniform float uDeltaT;

varying vec2 vUv;

// 速度場の発散を計算する
void main() {
  vec2 uv = vUv;
  // vec2 uv = gl_FragCoord.xy * uTexelSize;
  vec4 data = texture2D(uData, uv);

  // float left = texture2D(uData, uv - vec2(uTexelSize.x, 0.0)).x;
  // float right = texture2D(uData, uv + vec2(uTexelSize.x, 0.0)).x;
  // float up = texture2D(uData, uv - vec2(0.0, uTexelSize.y)).y;
  // float down = texture2D(uData, uv + vec2(0.0, uTexelSize.y)).y;

  float left = sampleNeighborVelocityReflect(uData, uv, uTexelSize, vec2(-1.0, 0.0), data.xy).x;
  float right = sampleNeighborVelocityReflect(uData, uv, uTexelSize, vec2(1.0, 0.0), data.xy).x;
  float up = sampleNeighborVelocityReflect(uData, uv, uTexelSize, vec2(0.0, -1.0), data.xy).y;
  float down = sampleNeighborVelocityReflect(uData, uv, uTexelSize, vec2(0.0, 1.0), data.xy).y;

  float div = (right - left + down - up) * 0.5;
  // dtが0.0にならないように最小値を設定
  float dt = max(uDeltaT, 1e-6);
  gl_FragColor = vec4(div / 0.014);
}
