precision highp float;

#include "./utils/applyReflectiveBoundary.glsl"

uniform sampler2D uData;
uniform vec2 uTexelSize;
uniform vec2 uForceCenter;
uniform vec2 uForceDeltaV;
uniform float uForceRadius;

varying vec2 vUv;

// 速度に外力を与える
void main() {
  vec2 uv = vUv;
  vec4 data = texture2D(uData, uv);

  // radiusが0以下にならないようにする
  vec2 radius = max(vec2(uForceRadius) * uTexelSize, vec2(1e-6));
  vec2 nd = (uv - uForceCenter) / radius;
  float len = length(nd);

  vec2 vOld = data.xy;

  float d = 1.0-min(len, 1.0);
  d *= d;

  vec2 force = applyReflectiveBoundary(uv, uTexelSize, vec2(vOld + uForceDeltaV * d), 1.0);

  gl_FragColor = vec4(force, data.zw);
}
