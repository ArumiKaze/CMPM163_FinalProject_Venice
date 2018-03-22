//Water Shader - Incorporates FresnelShader.js code by "mrdoob" from the three.js website

var waterVS = `
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform vec3 cameraPosition;

  attribute vec3 position; 
  attribute vec3 normal; 
  attribute vec2 uv;
  varying vec3 vI;
  varying vec3 vWorldNormal;
  varying vec2 vUV;
  varying vec3 vReflect;
  varying vec3 vRefract[3];
  varying float vReflectionFactor;
  //fresnel controls
  uniform float mRefractionRatio;
  uniform float mFresnelBias;
  uniform float mFresnelScale;
  uniform float mFresnelPower;
  void main() {
    vec4 mvPosition = viewMatrix * modelMatrix * vec4( position, 1.0 );
    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
    vWorldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );
    vUV = uv;
    vI = worldPosition.xyz - cameraPosition;
    vReflect = reflect(vI, vWorldNormal);
    vRefract[0] = refract( normalize( vI ), vWorldNormal, mRefractionRatio );
    vRefract[1] = refract( normalize( vI ), vWorldNormal, mRefractionRatio * 0.99 );
    vRefract[2] = refract( normalize( vI ), vWorldNormal, mRefractionRatio * 0.98 );
    vReflectionFactor = mFresnelBias + mFresnelScale * pow( 1.0 + dot( normalize( vI ), vWorldNormal ), mFresnelPower );
    gl_Position = projectionMatrix * mvPosition;
  }`;

var waterFS = `
  precision mediump float;
  
  uniform sampler2D texture; //change this for clouds, other objects, etc. 
  
  varying vec3 vI, vWorldNormal;
  varying vec2 vUV;
  varying vec3 vReflect;
  varying vec3 vRefract[3];
  varying float vReflectionFactor;
  void main() {
    //This is old code for simple reflection of the skybox without refraction
    //vec3 reflection = reflect( vI, vWorldNormal );
    //vec4 envColor = textureCube( tCube, vec3( -reflection.x, reflection.yz ) );
    //vec4 color = mix(envColor, vec4(0.0, 1.0, 1.3, 1.0), 0.5);
    //gl_FragColor = vec4(color);
    //reflection color
    vec4 reflectedColor = textureCube( tCube, vec3( -vReflect.x, vReflect.yz ) );
    
    //refraction color
    vec4 refractedColor = vec4( 1.0 );
    refractedColor.r = textureCube( tCube, vec3( -vRefract[0].x, vRefract[0].yz ) ).r;
    refractedColor.g = textureCube( tCube, vec3( -vRefract[1].x, vRefract[1].yz ) ).g;
    refractedColor.b = textureCube( tCube, vec3( -vRefract[2].x, vRefract[2].yz ) ).b;
    gl_FragColor = mix( refractedColor, reflectedColor, clamp( vReflectionFactor, 0.0, 1.0 ) );
  }`;