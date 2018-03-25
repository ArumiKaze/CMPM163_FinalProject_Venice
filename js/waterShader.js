//This code was borrowed and modified from the original "Zelda-Windwaker" example presented in Week 9 of the Lab.

var waterVS = `
    #define SCALE 10.0

    uniform float uTime;
    uniform float uStrength;
    varying vec2 vUv;
	varying vec3 vNormal;

    float calculateSurface(float x, float z) {
        float y = 0.0;
        y += (sin(x * 1.0 / SCALE + uTime * 1.0) + sin(x * 2.3 / SCALE + uTime * 1.5) + sin(x * 3.3 / SCALE + uTime * 0.4)) / 3.0;
        y += (sin(z * 5.2 / SCALE + uTime * 1.8) + sin(z * 1.8 / SCALE + uTime * 1.8) + sin(z * 2.8 / SCALE + uTime * 5.8)) / 3.0;
        y += (sin(z * 10.2 / SCALE + uTime * 1.8) + sin(z * 2.8 / SCALE + uTime * 1.8) + sin(z * 3.8 / SCALE + uTime * 5.8)) / 3.0;
        return y;
    }

    void main() {
        vUv = uv;
		vNormal = normal;
        vec3 pos = position;

        pos.z += uStrength * calculateSurface(pos.x, pos.y);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

var waterFS = `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uStrength;
    uniform sampler2D uMap;
    uniform vec3 uColor;
	uniform vec3 sunPos;
	uniform vec3 moonPos;
	varying vec3 vNormal;

    vec2 fragNoise(vec2 pos) {
        vec2 noisePos = pos;

        noisePos.y += 0.05 * (sin(noisePos.x * 3.5 + uTime * 0.35) + sin(noisePos.x * 4.8 + uTime * 1.05) + sin(noisePos.x * 7.3 + uTime * 0.45)) / 3.0;
        noisePos.y += 0.10 * (sin(noisePos.x * 4.2 + uTime * 0.64) + sin(noisePos.x * 6.3 + uTime * 1.65) + sin(noisePos.x * 8.2 + uTime * 0.45)) / 3.0;
        noisePos.x += 0.15 * (sin(noisePos.y * 1.5 + uTime * 0.5)  + sin(noisePos.y * 6.8 + uTime * 0.75) + sin(noisePos.y * 11.3 + uTime * 0.2)) / 3.0;
        noisePos.x += 0.20 * (sin(noisePos.y * 2.2 + uTime * 0.5)  + sin(noisePos.y * 6.8 + uTime * 0.75) + sin(noisePos.y * 5.2 + uTime * 0.2)) / 3.0;

        return noisePos;
    }

    void main() {
        vec2 uv = vUv * 10.0 + vec2(uTime * -0.05);
        uv = fragNoise(uv);

        vec4 tex1 = texture2D(uMap, uv * 15.0);
        vec4 tex2 = texture2D(uMap, uv * 15.0 + vec2(2.0));

        vec4 final = vec4(uColor.xyz + vec3(tex1.a * 0.9 - tex2.a * 0.02), 1.0);
		
		if (sunPos.y > 0.0) {
			vec3 sunDirection = normalize(sunPos.xyz);
			float sunDiffuse = min(max(dot(vNormal, sunDirection), 0.5), 0.85);
			if (vNormal.y == 1.0) {
				gl_FragColor = vec4(vec3(0.75, 0.72, 0.65)*sunDiffuse, 1.0)*final;
			} 
			else {
				gl_FragColor = vec4(vec3(0.67, 0.62, 0.53)*sunDiffuse, 1.0)*final;
			}
		} 
		else {
			vec3 moonDirection = normalize(moonPos.xyz);
			float moonDiffuse = min(max(dot(vNormal, moonDirection), 0.2), 0.6);
			if (vNormal.y == 1.0) {
				gl_FragColor = vec4(vec3(0.75, 0.72, 0.65)*moonDiffuse, 1.0)*final;
				gl_FragColor.z = gl_FragColor.z*1.2;
				gl_FragColor = normalize(gl_FragColor);
			} 
			else {
				gl_FragColor = vec4(vec3(0.67, 0.62, 0.53)*moonDiffuse, 1.0)*final;
				gl_FragColor.z = gl_FragColor.z*1.2;
				gl_FragColor = normalize(gl_FragColor);
			}
		}
    }`;
