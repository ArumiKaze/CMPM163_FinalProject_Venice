//Implementation is an expanded/modified version of MrDoob's webgl clouds found at http://mrdoob.com/lab/javascript/webgl/clouds/

var cloudVS = `
	varying vec2 vUv;

	//modifiable values
	uniform float cloudSpreadWidth; //this number needs to be quite high in order for changes to be noticable
	uniform float cloudProximity; //this determines how close the clouds are together
	uniform float cloudDepth; //this should be changed with cloudSpreadWidth in order to create more cloud layers
	uniform float cloudSize; //this is one factor in determining the size of the clouds ~ it should be changed alongsize the (x,y) of the plane

	void main() {
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	}`;

var cloudFS = `
	uniform sampler2D texture;

	varying vec2 vUv;

	void main() {
		float depth = gl_FragCoord.z / gl_FragCoord.w;
		gl_FragColor = texture2D( texture, vUv );
		gl_FragColor.w *= pow( gl_FragCoord.z, 20.0 );
	}`;

