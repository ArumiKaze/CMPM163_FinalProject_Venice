var skyvs = `
		uniform vec3 sunPosition;
		uniform vec3 moonPosition;
		uniform float rayleigh;
		uniform float turbidity;
		uniform float mieCoefficient;
		uniform float moonrayleigh;
		uniform float moonturbidity;
		uniform float moonmieCoefficient;

		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying vec3 vMoonDirection;
		varying float vSunfade;
		varying float vMoonfade;
		varying vec3 vBetaR;
		varying vec3 vBetaR2;
		varying vec3 vBetaM;
		varying vec3 vBetaM2;
		varying float vSunE;
		varying float vMoonE;

		const vec3 up = vec3( 0.0, 1.0, 0.0 );
		const float e = 2.71828182845904523536028747135266249775724709369995957;
		const float pi = 3.141592653589793238462643383279502884197169;


		const vec3 lambda = vec3( 680E-9, 550E-9, 450E-9 );

		const vec3 totalRayleigh = vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 );

		const float v = 4.0;
		const vec3 K = vec3( 0.686, .678, 0.666 );

		const vec3 MieConst = vec3( 1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14 );

		const float cutoffAngle = 1.5610731556870734;
		const float steepness = 1.5;
		const float EE = 1000.0;

		float sunIntensity( float zenithAngleCos ) {
			zenithAngleCos = clamp( zenithAngleCos, -1.0, 1.0 );
			return EE * max( 0.0, 1.0 - pow( e, -( ( cutoffAngle - acos( zenithAngleCos ) ) / steepness ) ) );
		}

		vec3 totalMie( float T ) {
			float c = ( 0.2 * T ) * 10E-18;
			return 0.434 * c * MieConst;
		}

		void main() {

			vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
			vWorldPosition = worldPosition.xyz;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			vSunDirection = normalize( sunPosition );
			vMoonDirection = normalize( moonPosition );

			vSunE = sunIntensity( dot( vSunDirection, up ) );
			vMoonE = sunIntensity( dot( vMoonDirection, up ) );

			vSunfade = 1.0 - clamp( 1.0 - exp( ( sunPosition.y / 450000.0 ) ), 0.0, 1.0 );
			vMoonfade = 1.0 - clamp( 1.0 - exp( ( moonPosition.y / 450000.0 ) ), 0.0, 1.0 );

			float rayleighCoefficient = rayleigh - ( 1.0 * ( 1.0 - vSunfade ) );
			float rayleighCoefficient2 = moonrayleigh - ( 1.0 * ( 1.0 - vMoonfade ) );

			vBetaR = totalRayleigh * rayleighCoefficient;
			vBetaR2 = totalRayleigh * rayleighCoefficient2;

			vBetaM = totalMie( turbidity ) * mieCoefficient;
			vBetaM2 = totalMie( moonturbidity ) * moonmieCoefficient;

		}
`;

var skyfs = `
		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying vec3 vMoonDirection;
		varying float vSunfade;
		varying float vMoonfade;
		varying vec3 vBetaR;
		varying vec3 vBetaR2;
		varying vec3 vBetaM;
		varying vec3 vBetaM2;
		varying float vSunE;
		varying float vMoonE;

		uniform float luminance;
		uniform float mieDirectionalG;
		uniform float moonmieDirectionalG;

		const vec3 cameraPos = vec3( 0.0, 0.0, 0.0 );

		const float pi = 3.141592653589793238462643383279502884197169;

		const float n = 1.0003;
		const float N = 2.545E25;

		const float rayleighZenithLength = 8.4E3;
		const float mieZenithLength = 1.25E3;
		const vec3 up = vec3( 0.0, 1.0, 0.0 );
		const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;

		const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
		const float ONE_OVER_FOURPI = 0.07957747154594767;

		float rayleighPhase( float cosTheta ) {
			return THREE_OVER_SIXTEENPI * ( 1.0 + pow( cosTheta, 2.0 ) );
		}

		float hgPhase( float cosTheta, float g ) {
			float g2 = pow( g, 2.0 );
			float inverse = 1.0 / pow( 1.0 - 2.0 * g * cosTheta + g2, 1.5 );
			return ONE_OVER_FOURPI * ( ( 1.0 - g2 ) * inverse );
		}

		const float A = 0.15;
		const float B = 0.50;
		const float C = 0.10;
		const float D = 0.20;
		const float E = 0.02;
		const float F = 0.30;

		const float whiteScale = 1.0748724675633854;

		vec3 Uncharted2Tonemap( vec3 x ) {
			return ( ( x * ( A * x + C * B ) + D * E ) / ( x * ( A * x + B ) + D * F ) ) - E / F;
		}


		void main() {

			float zenithAngle = acos( max( 0.0, dot( up, normalize( vWorldPosition - cameraPos ) ) ) );
			float inverse = 1.0 / ( cos( zenithAngle ) + 0.15 * pow( 93.885 - ( ( zenithAngle * 180.0 ) / pi ), -1.253 ) );
			float sR = rayleighZenithLength * inverse;
			float sM = mieZenithLength * inverse;

			vec3 Fex = exp( -( vBetaR * sR + vBetaM * sM ) );
			vec3 Fex2 = exp( -( vBetaR2 * sR + vBetaM2 * sM ) );

			float cosTheta = dot( normalize( vWorldPosition - cameraPos ), vSunDirection );
			float cosTheta2 = dot( normalize( vWorldPosition - cameraPos ), vMoonDirection );

			float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
			float rPhase2 = rayleighPhase( cosTheta2 * 0.5 + 0.5 );
			vec3 betaRTheta = vBetaR * rPhase;
			vec3 betaRTheta2 = vBetaR2 * rPhase2;

			float mPhase = hgPhase( cosTheta, mieDirectionalG );
			float mPhase2 = hgPhase( cosTheta2, moonmieDirectionalG );
			vec3 betaMTheta = vBetaM * mPhase;
			vec3 betaMTheta2 = vBetaM2 * mPhase2;

			vec3 Lin = pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - Fex ), vec3( 1.5 ) );
			vec3 Lin2 = pow( vMoonE * ( ( betaRTheta2 + betaMTheta2 ) / ( vBetaR2 + vBetaM2 ) ) * ( 1.0 - Fex2 ), vec3( 1.5 ) );
			Lin *= mix( vec3( 1.0 ), pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * Fex, vec3( 1.0 / 2.0 ) ), clamp( pow( 1.0 - dot( up, vSunDirection ), 5.0 ), 0.0, 1.0 ) );
			Lin2 *= mix( vec3( 1.0 ), pow( vMoonE * ( ( betaRTheta2 + betaMTheta2 ) / ( vBetaR2 + vBetaM2 ) ) * Fex2, vec3( 1.0 / 2.0 ) ), clamp( pow( 1.0 - dot( up, vMoonDirection ), 5.0 ), 0.0, 1.0 ) );


			vec3 direction = normalize( vWorldPosition - cameraPos );
			float theta = acos( direction.y );
			float phi = atan( direction.z, direction.x );
			vec2 uv = vec2( phi, theta ) / vec2( 2.0 * pi, pi ) + vec2( 0.5, 0.0 );
			vec3 L0 = vec3( 0.1 ) * Fex;
			vec3 L02 = vec3( 0.1 ) * Fex2;

			float sundisk = smoothstep( sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta );
			float sundisk2 = smoothstep( sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta2 );
			L0 += ( vSunE * 19000.0 * Fex) * sundisk;
			L0 += ( vMoonE * 19000.0 * Fex2) * sundisk2;

			vec3 texColor = ( Lin + L0 ) * 0.04 + vec3( 0.0, 0.0003, 0.00075 );
			vec3 texColor2 = ( Lin2 + L02 ) * 0.04 + vec3( 0.0, 0.0003, 0.00075 );

			vec3 curr = Uncharted2Tonemap( ( log2( 2.0 / pow( luminance, 4.0 ) ) ) * texColor );
			vec3 curr2 = Uncharted2Tonemap( ( log2( 2.0 / pow( luminance, 4.0 ) ) ) * texColor2 );
			vec3 color = curr * whiteScale;
			vec3 color2 = curr2 * whiteScale;

			vec3 retColor = pow( color, vec3( 1.0 / ( 1.2 + ( 1.2 * vSunfade ) ) ) );
			vec3 retColor2 = pow( color2, vec3( 1.0 / ( 1.2 + ( 1.2 * vMoonfade ) ) ) );

			gl_FragColor = vec4( retColor+retColor2, 1.0 );

		}
`;