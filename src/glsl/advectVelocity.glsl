precision highp float;

#include "./utils/mirrorRepeatUv.glsl"
#include "./utils/sampleBilinear4.glsl"
#include "./utils/applyReflectiveBoundary.glsl"

uniform sampler2D uData;
uniform vec2 uTexelSize;
uniform float uDeltaT;
uniform float uDissipation;

varying vec2 vUv;


// 移流を計算する
void main() {
  vec2 ratio = uTexelSize / min(uTexelSize.x, uTexelSize.y); // UV/秒
  // vec2 uv = gl_FragCoord.xy * uTexelSize;
  vec2 uv = vUv;
  vec4 data = texture2D(uData, uv);

  vec2 backUv = uv - data.xy * uDeltaT * ratio;
  backUv = clamp(backUv, uTexelSize*0.5, 1.0-uTexelSize*0.5); // 境界
  vec2 newVal = texture2D(uData, backUv).xy * uDissipation;

  gl_FragColor = vec4(newVal,data.zw);
}
