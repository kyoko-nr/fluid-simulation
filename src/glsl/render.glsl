precision highp float;

uniform sampler2D uTexture;
uniform vec2 uTextureSize;
uniform float uTimeStep;
uniform float uColorStrength;
uniform vec3 uBgColor;
uniform vec3 uFluidColor;

varying vec2 vUv;

// 計算結果をレンダリングする
void main() {
  vec2 uv0 = vUv;
  vec2 uv = vec2(uv0.x, 1.0 - uv0.y);

  vec2 vel = texture2D(uTexture, uv).xy;
  float len = length(vel) * uColorStrength;

  vec3 color = mix(uBgColor, uFluidColor, len);

  gl_FragColor = vec4(color, 1.0);
}
