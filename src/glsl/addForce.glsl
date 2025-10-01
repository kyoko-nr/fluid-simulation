precision highp float;

#include "./utils/applyReflectiveBoundary.glsl"

uniform sampler2D uData;
uniform vec2 uTexelSize;
uniform vec2 uForceCenter;
uniform vec2 uForceDeltaV;
uniform float uForceRadius;

// 速度に外力を与える
void main() {
  vec2 uv = gl_FragCoord.xy * uTexelSize;
  vec4 data = texture2D(uData, uv);

  vec2 radius = max(vec2(uForceRadius) * uTexelSize, vec2(1e-6));
  vec2 nd = (uv - uForceCenter) / radius;

  vec2 vOld = data.xy;
  float falloff = exp(-dot(nd, nd));
  vec2 vPointer = vOld + uForceDeltaV * falloff;

  vec2 vBounded = applyReflectiveBoundary(uv, uTexelSize, vPointer, 1.0);

  gl_FragColor = vec4(vBounded, data.zw);
}
