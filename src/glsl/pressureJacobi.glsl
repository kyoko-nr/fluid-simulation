precision highp float;

#include "./utils/sampleNeighborPressureNeumann.glsl"

uniform sampler2D uData;
uniform vec2 uTexelSize;

// Jacobi法で圧力を計算する
void main() {
  vec2 uv = gl_FragCoord.xy * uTexelSize;
  vec4 data = texture2D(uData, uv);

  float step = 2.0;

  float left = sampleNeighborPressureNeumann(uData, uv, uTexelSize, vec2(-step, 0.0), data.z);
  float right = sampleNeighborPressureNeumann(uData, uv, uTexelSize, vec2(step, 0.0), data.z);
  float up = sampleNeighborPressureNeumann(uData, uv, uTexelSize, vec2(0.0, -step), data.z);
  float down = sampleNeighborPressureNeumann(uData, uv, uTexelSize, vec2(0.0, step), data.z);

  float div = data.w;

  float pressure = (left + right + up + down - div) * 0.25;
  gl_FragColor = vec4(data.xy, pressure, data.w);
}
