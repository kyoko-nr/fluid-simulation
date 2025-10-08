precision highp float;

uniform sampler2D uTexture;

varying vec2 vUv;

void main() {
  vec4 data = texture2D(uTexture, vUv);
  
  vec3 color = vec3(0.0);

  float mag = length(vec2(data.x, data.y));

  color = vec3(mag * 1.0);
  gl_FragColor = vec4(color, 1.0);
}


