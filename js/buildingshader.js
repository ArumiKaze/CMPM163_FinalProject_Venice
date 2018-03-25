var buildingvs = `
varying vec3 vNormal;
varying vec2 vUV;
void main() {
  vNormal = normal;
  vUV = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

var buildingfs = `
uniform vec3 sunPos;
uniform vec3 moonPos;
uniform sampler2D wall;
varying vec3 vNormal;
varying vec2 vUV;
void main() {

  if (sunPos.y > 0.0) {
    vec3 sunDirection = normalize(sunPos.xyz);
    float sunDiffuse = min(max(dot(vNormal, sunDirection), 0.5), 0.85);
    if (int(vNormal.z+0.5) == 1) {
      gl_FragColor = vec4(vec3(0.96, 0.50, 0.34)*sunDiffuse, 1.0);
    } else {
      gl_FragColor = texture2D(wall, vUV) * sunDiffuse;
    }
  } else {
    vec3 moonDirection = normalize(moonPos.xyz);
    float moonDiffuse = min(max(dot(vNormal, moonDirection), 0.3), 0.6);
    if (int(vNormal.z+0.5) == 1) {
      gl_FragColor = vec4(vec3(0.96, 0.50, 0.34)*moonDiffuse, 1.0);
      gl_FragColor.z = gl_FragColor.z*1.2;
      normalize(gl_FragColor);
    } else {
      gl_FragColor = texture2D(wall, vUV) * moonDiffuse;
      gl_FragColor.z = gl_FragColor.z*1.2;
      normalize(gl_FragColor);
    }
  }

}
`;
