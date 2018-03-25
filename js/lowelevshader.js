var lowelevvs = `
varying vec3 vNormal;
varying vec2 vUV;
void main() {
  vNormal = normal;
  vUV = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

var lowelevfs = `
uniform vec3 sunPos;
uniform vec3 moonPos;
varying vec3 vNormal;
varying vec2 vUV;
void main() {

  if (sunPos.y > 0.0) {
    vec3 sunDirection = normalize(sunPos.xyz);
    float sunDiffuse = min(max(dot(vNormal, sunDirection), 0.5), 0.85);
    if (vNormal.y == 1.0) {
      gl_FragColor = vec4(vec3(0.75, 0.72, 0.65)*sunDiffuse, 1.0) ;
    } else {
      gl_FragColor = vec4(vec3(0.67, 0.62, 0.53)*sunDiffuse, 1.0);
    }
  } else {
    vec3 moonDirection = normalize(moonPos.xyz);
    float moonDiffuse = min(max(dot(vNormal, moonDirection), 0.2), 0.6);
    if (vNormal.y == 1.0) {
      gl_FragColor = vec4(vec3(0.75, 0.72, 0.65)*moonDiffuse, 1.0);
      gl_FragColor.z = gl_FragColor.z*1.2;
      gl_FragColor = normalize(gl_FragColor);
    } else {
      gl_FragColor = vec4(vec3(0.67, 0.62, 0.53)*moonDiffuse, 1.0);
      gl_FragColor.z = gl_FragColor.z*1.2;
      gl_FragColor = normalize(gl_FragColor);
    }
  }

}
`;
