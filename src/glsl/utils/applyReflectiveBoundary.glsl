vec2 applyReflectiveBoundary(vec2 uv, vec2 texelSize, vec2 velocity, float elasticity) {
  vec2 edgeUV = texelSize * 0.5;
  vec2 v = velocity;

  if (uv.x <= edgeUV.x && v.x < 0.0) {
    v.x = -v.x * elasticity;
  }
  if (uv.x >= (1.0 - edgeUV.x) && v.x > 0.0) {
    v.x = -v.x * elasticity;
  }
  if (uv.y <= edgeUV.y && v.y < 0.0) {
    v.y = -v.y * elasticity;
  }
  if (uv.y >= (1.0 - edgeUV.y) && v.y > 0.0) {
    v.y = -v.y * elasticity;
  }

  return v;
}
