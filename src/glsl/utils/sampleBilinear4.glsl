// テクスチャーを手動のBilinear補間でサンプリングする
vec4 sampleBilinear4(sampler2D tex, vec2 uv, vec2 texelSize) {
  vec2 uv00 = (floor(uv / texelSize - 0.5) + 0.5) * texelSize;
  vec2 uv00Min = texelSize * 0.5;
  vec2 uv00Max = vec2(1.0) - texelSize * 1.5;
  uv00 = clamp(uv00, uv00Min, uv00Max);

  vec2 uv10 = uv00 + vec2(texelSize.x, 0.0);
  vec2 uv01 = uv00 + vec2(0.0, texelSize.y);
  vec2 uv11 = uv00 + texelSize;

  vec4 c00 = texture2D(tex, uv00);
  vec4 c10 = texture2D(tex, uv10);
  vec4 c01 = texture2D(tex, uv01);
  vec4 c11 = texture2D(tex, uv11);

  vec2 f = clamp((uv - uv00) / texelSize, 0.0, 1.0);
  vec4 cx0 = mix(c00, c10, f.x);
  vec4 cx1 = mix(c01, c11, f.x);
  return mix(cx0, cx1, f.y);
}
