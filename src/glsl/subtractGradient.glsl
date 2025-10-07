precision highp float;

#include "./utils/sampleNeighborPressureNeumann.glsl"
#include "./utils/applyReflectiveBoundary.glsl"

uniform sampler2D uData;
uniform vec2 uTexelSize;

varying vec2 vUv;

// 速度場から圧力勾配を減算する
void main() {
  vec2 uv = vUv;
  vec4 data = texture2D(uData, uv);

  float left = sampleNeighborPressureNeumann(uData, uv, uTexelSize, vec2(-1.0, 0.0), data.z);
  float right = sampleNeighborPressureNeumann(uData, uv, uTexelSize, vec2(1.0, 0.0), data.z);
  float up = sampleNeighborPressureNeumann(uData, uv, uTexelSize, vec2(0.0, -1.0), data.z);
  float down = sampleNeighborPressureNeumann(uData, uv, uTexelSize, vec2(0.0, 1.0), data.z);

  vec2 vel = texture2D(uData, uv).xy;
  vec2 gradP = vec2(right - left, down - up) * 0.5;
  vel = vel - gradP * 0.014;
  gl_FragColor = vec4(vel, data.zw);
}
