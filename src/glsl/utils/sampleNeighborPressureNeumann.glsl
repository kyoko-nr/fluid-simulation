float sampleNeighborPressureNeumann(
  sampler2D tex,
  vec2 uv,
  vec2 texelSize,
  vec2 dir,
  float pCenter
) {
  vec2 edgeUV = texelSize * 0.5;
  float pNeighbor = texture2D(tex, uv + dir * texelSize).z;

  if (uv.x <= edgeUV.x && dir.x < 0.0) {
    pNeighbor = pCenter;
  }
  if (uv.x >= (1.0 - edgeUV.x) && dir.x > 0.0) {
    pNeighbor = pCenter;
  }
  if (uv.y <= edgeUV.y && dir.y < 0.0) {
    pNeighbor = pCenter;
  }
  if (uv.y >= (1.0 - edgeUV.y) && dir.y > 0.0) {
    pNeighbor = pCenter;
  }

  return pNeighbor;
}
