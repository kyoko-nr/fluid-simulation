// 隣接セルの速度をサンプリングする
// 境界外は法線成分の反射を適用
vec2 sampleNeighborVelocityReflect(
  sampler2D tex,
  vec2 uv,
  vec2 texelSize,
  vec2 dir,
  vec2 vCenter
) {
  vec2 edgeUV = texelSize * 0.5;
  vec2 vNeighbor = texture2D(tex, uv + dir * texelSize).xy;

  if (uv.x <= edgeUV.x && dir.x < 0.0) {
    vNeighbor = vec2(-vCenter.x, vCenter.y);
  }
  if (uv.x >= (1.0 - edgeUV.x) && dir.x > 0.0) {
    vNeighbor = vec2(-vCenter.x, vCenter.y);
  }
  if (uv.y <= edgeUV.y && dir.y < 0.0) {
    vNeighbor = vec2(vCenter.x, -vCenter.y);
  }
  if (uv.y >= (1.0 - edgeUV.y) && dir.y > 0.0) {
    vNeighbor = vec2(vCenter.x, -vCenter.y);
  }

  return vNeighbor;
}
