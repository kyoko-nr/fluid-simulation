precision highp float;

uniform sampler2D uTexture;
uniform int uChannel; // 0=r, 1=g, 2=b, 3=a, 4=rg, 5=gb, 6=ba
uniform float uScale;
uniform float uOffset;

varying vec2 vUv;

void main() {
  vec4 data = texture2D(uTexture, vUv);
  
  // float value = 0.0;
  vec3 color = vec3(0.0);
  
  // if (uChannel == 0) {
  //   // R channel only
  //   value = data.r;
  //   color = vec3(value);
  // } else if (uChannel == 1) {
  //   // G channel only
  //   value = data.g;
  //   color = vec3(value);
  // } else if (uChannel == 2) {
  //   // B channel only
  //   value = data.b;
  //   color = vec3(value);
  // } else if (uChannel == 3) {
  //   // A channel only
  //   value = data.a;
  //   color = vec3(value);
  // } else if (uChannel == 4) {
  //   // RG as color
  //   color = vec3(data.r, data.g, 0.0);
  // } else if (uChannel == 5) {
  //   // GB as color
  //   color = vec3(0.0, data.g, data.b);
  // } else if (uChannel == 6) {
  //   // RG with magnitude visualization
  //   float mag = length(data.rg);
  //   color = vec3(mag);
  // } else if (uChannel == 7) {
  //   // RG as red-green heat map
  //   color = vec3(data.r * 0.5 + 0.5, data.g * 0.5 + 0.5, 0.0);
  // }
  
  // color = color * uScale + uOffset;

  // color = vec3(vUv, 0.0);
  float mag = length(data.xy);
  color = vec3(mag * 1.0);
  gl_FragColor = vec4(color, 1.0);
}


