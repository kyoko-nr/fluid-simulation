precision highp float;

#include "./utils/sampleNeighborVelocityReflect.glsl"

uniform sampler2D uData;
uniform vec2 uTexelSize;
uniform float uDeltaT;

varying vec2 vUv;

// 速度場の発散を計算する
void main() {
  vec2 uv = vUv;
  vec4 data = texture2D(uData, uv);

  float left = sampleNeighborVelocityReflect(uData, uv, uTexelSize, vec2(-1.0, 0.0), data.xy).x;
  float right = sampleNeighborVelocityReflect(uData, uv, uTexelSize, vec2(1.0, 0.0), data.xy).x;
  float up = sampleNeighborVelocityReflect(uData, uv, uTexelSize, vec2(0.0, -1.0), data.xy).y;
  float down = sampleNeighborVelocityReflect(uData, uv, uTexelSize, vec2(0.0, 1.0), data.xy).y;

  float div = (right - left + down - up) * 0.5;
  gl_FragColor = vec4(data.xy, data.z,div / uDeltaT);
}
