vec2 mirrorRepeatUv(vec2 uv, vec2 texelSize) {
  vec2 uvMin = texelSize * 0.5;
  vec2 uvMax = vec2(1.0) - uvMin;
  vec2 span = uvMax - uvMin;

  vec2 t = (uv - uvMin) / span;
  vec2 tri = 1.0 - abs(1.0 - fract(t * 0.5) * 2.0);

  return uvMin + tri * span;
}
