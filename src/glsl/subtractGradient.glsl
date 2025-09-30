precision highp float;

#include "./utils/sampleNeighborPressureNeumann.glsl"
#include "./utils/applyReflectiveBoundary.glsl"

uniform sampler2D uData;
uniform vec2 uTexelSize;

void main() {
  vec2 uv = gl_FragCoord.xy * uTexelSize;
  vec4 data = texture2D(uData, uv);

  float left = sampleNeighborPressureNeumann(uData, uv, uTexelSize, vec2(-1.0, 0.0), data.z);
  float right = sampleNeighborPressureNeumann(uData, uv, uTexelSize, vec2(1.0, 0.0), data.z);
  float up = sampleNeighborPressureNeumann(uData, uv, uTexelSize, vec2(0.0, -1.0), data.z);
  float down = sampleNeighborPressureNeumann(uData, uv, uTexelSize, vec2(0.0, 1.0), data.z);

  vec2 velocity = data.xy - vec2(right - left, down - up) * 0.5;
  vec2 bounded = applyReflectiveBoundary(uv, uTexelSize, velocity, 1.0);

  gl_FragColor = vec4(bounded, data.zw);
}
