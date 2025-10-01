precision highp float;

#include "./utils/applyReflectiveBoundary.glsl"

uniform sampler2D uData;
uniform vec2 uTexelSize;
uniform vec2 uForceCenter;
uniform vec2 uForceDeltaV;
uniform float uForceRadius;
uniform float uFalloffExp;

// 速度に外力を与える
void main() {
  vec2 uv = gl_FragCoord.xy * uTexelSize;
  vec4 data = texture2D(uData, uv);

  // radiusが0以下にならないようにする
  vec2 radius = max(vec2(uForceRadius) * uTexelSize, vec2(1e-6));
  vec2 nd = (uv - uForceCenter) / radius;
  float len = length(nd);

  vec2 vOld = data.xy;

  // 外力を滑らかに減衰させる。(1 - smoothstep)に指数を掛けて中心を鋭く
  float t = clamp(len, 0.0, 1.0);
  float base = 1.0 - smoothstep(0.0, 1.0, t);
  float falloff = pow(base, max(uFalloffExp, 1.0));

  vec2 vPointer = vOld + uForceDeltaV * falloff;

  vec2 vBounded = applyReflectiveBoundary(uv, uTexelSize, vPointer, 1.0);

  gl_FragColor = vec4(vBounded, data.zw);
}
