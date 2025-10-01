precision highp float;

#include "./utils/mirrorRepeatUv.glsl"
#include "./utils/sampleBilinear4.glsl"
#include "./utils/applyReflectiveBoundary.glsl"

uniform sampler2D uData;
uniform vec2 uTexelSize;
uniform float uDeltaT;
uniform float uDissipation;

// 移流を計算する
void main() {
  vec2 uv = gl_FragCoord.xy * uTexelSize;
  vec4 data = texture2D(uData, uv);

  vec2 backUv0 = uv - data.xy * uDeltaT * uTexelSize;
  vec2 backUv = mirrorRepeatUv(backUv0, uTexelSize);

  // 手動Bilinear補間で滑らかにサンプルし、境界反射も適用する
  vec2 advect0 = sampleBilinear4(uData, backUv, uTexelSize).xy;
  vec2 advect1 = advect0 * uDissipation;
  vec2 advect = applyReflectiveBoundary(uv, uTexelSize, advect1, 1.0);

  gl_FragColor = vec4(advect, data.zw);
}
