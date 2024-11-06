//-----------------------------------------------------------------------------------------------//
#version 460

uniform sampler2D ColourMap;
uniform sampler2D PositionMap;
uniform usampler2D IDMap;
uniform vec2 PixelSize;

uniform float outlineThickness = 1.0;

uniform sampler3D NoiseMap;

in vec2 FragTexCoords;

out vec4 Colour;


//-----------------------------------------------------------------------------------------------//
//
//    							Simplex 3D Noise 
//    		by Ian McEwan, Stefan Gustavson (https://github.com/stegu/webgl-noise)
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
	const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
	const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
	vec3 i  = floor(v + dot(v, C.yyy) );
	vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
	vec3 g = step(x0.yzx, x0.xyz);
	vec3 l = 1.0 - g;
	vec3 i1 = min( g.xyz, l.zxy );
	vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
	vec3 x1 = x0 - i1 + 1.0 * C.xxx;
	vec3 x2 = x0 - i2 + 2.0 * C.xxx;
	vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
	i = mod(i, 289.0 ); 
	vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
	float n_ = 1.0/7.0; // N=7
	vec3  ns = n_ * D.wyz - D.xzx;

	vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

	vec4 x_ = floor(j * ns.z);
	vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

	vec4 x = x_ *ns.x + ns.yyyy;
	vec4 y = y_ *ns.x + ns.yyyy;
	vec4 h = 1.0 - abs(x) - abs(y);

	vec4 b0 = vec4( x.xy, y.xy );
	vec4 b1 = vec4( x.zw, y.zw );

	vec4 s0 = floor(b0)*2.0 + 1.0;
	vec4 s1 = floor(b1)*2.0 + 1.0;
	vec4 sh = -step(h, vec4(0.0));

	vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
	vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

	vec3 p0 = vec3(a0.xy,h.x);
	vec3 p1 = vec3(a0.zw,h.y);
	vec3 p2 = vec3(a1.xy,h.z);
	vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
	vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
	p0 *= norm.x;
	p1 *= norm.y;
	p2 *= norm.z;
	p3 *= norm.w;

// Mix final noise value
	vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
	m = m * m;
	return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}


// Simplex 2D noise
//
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}


//-----------------------------------------------------------------------------------------------//
//------------------------------------------OWN FUNCTIONS----------------------------------------//
//-----------------------------------------------------------------------------------------------//

vec3 ObjectSpacePosLookup(vec2 uvs)
{
	return vec3(texture(PositionMap, uvs)).xyz;

}

uvec2 IDLookup(vec2 uvs)
{
	return uvec2(texture(IDMap, uvs)).xy;
}

// if use colour i
bool DifferentColours(vec3 colA, vec3 colB)
{
	return colA != colB;
}


#define CIRCLE_TAPS 16

void main() // Frag
{
	// define reused values
	float pi = 3.14159;	
	
	// Get UV coords
	vec2 uvs = FragTexCoords;
	vec3 screenColour = texture(ColourMap, FragTexCoords).xyz;
	vec3 vertexPos = texture(PositionMap, FragTexCoords).xyz;
	
	// access ID lookup from IDMap
	// each object has their own ID
	uvec2 thisID = IDLookup(uvs);
	
	// get the radius 
	float sinAngle = sin(2.0 * pi / float(CIRCLE_TAPS));
	float cosAngle = cos(2.0 * pi / float(CIRCLE_TAPS));
	
	float inCount = 0.0;
	vec2 averageOffset;
	float maxOutlineRange = 8.0;
	
	// how far away the algorithim should look away
	vec2 uvOffset = vec2(0.5, 0.0);
	
	// tap the pixel/frag around each pixel/frag
	// box shape around each fragment use points
	// to sample colour later
	//vec2 neighbourTaps[4] = vec2[4](
	//vec2(1.0, 0.0), vec2(-1.0, 0.0), vec2(0.0, 1.0), vec2(0.0, -1.0));
	
	float outlineLevel = 0.0;
	
	
	
	for(int i = 0; i < CIRCLE_TAPS; i++){
		// check ID of pixel uvOffset amount away 
		uvec2 otherID = IDLookup(uvs + uvOffset * PixelSize * maxOutlineRange);
		if(otherID != thisID){
			inCount += 1.0;
			//Colour += vec4(1.0, 0.0, 0.0, 1.0);
			averageOffset += uvOffset;
		}
		
		// update the offset to the next point in the circle
		vec2 originalOffset = uvOffset;
		uvOffset.x = originalOffset.x * cosAngle - originalOffset.y * sinAngle;
		uvOffset.y = originalOffset.x * sinAngle + originalOffset.y * cosAngle;
		
	}
	
	// if inCount is above 0 there may be a line at the current pixel
	// do binary search to find the pixel
	if (inCount > 0.0) {
		// ?
		vec2 maxOffset = normalize(averageOffset) * PixelSize * maxOutlineRange;
		vec2 noiseUV;
		float distanceAlongRay = 2.0;
		int searchCount = 32;
		bool foreground = false;
		
		
		for (int i = 0; i < searchCount; i++)
		{
			float fraction = float(i) / float(searchCount - 1);
			uvec2 otherID = IDLookup(uvs + maxOffset * fraction);
			if (otherID != thisID){
				if(otherID.x > thisID.x){
					noiseUV = uvs + maxOffset * fraction;
				}
				else{
					noiseUV = uvs + maxOffset * (float(i-1) / float(searchCount - 1));
					foreground = true;
				}
				distanceAlongRay = fraction;
				break;
			}
		}
		float noiseVal = snoise(ObjectSpacePosLookup(noiseUV).xz);
	
		if (foreground) noiseVal = 1.0 - noiseVal;
		noiseVal = noiseVal * 1.5;
		outlineLevel = 1.0 - distanceAlongRay;
		outlineLevel -= noiseVal;
		outlineLevel *= 5.0;
		outlineLevel += noiseVal;
		outlineLevel = clamp(outlineLevel,0.0, 1.0);
	}

	// declare outline colour
	// maybe make into uniform or 
	// write some code for sampling each object
	vec3 outlineColour = vec3(0.0, 0.0, 0.0);
	
	Colour = vec4(mix(screenColour, outlineColour, outlineLevel),1.0);
}
