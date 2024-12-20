#version 460

#define PI 3.14159265359

in vec3 FragPos;
in vec3 ObjectSpaceFragPos;

in vec3 N;
in mat3 TBN;

in vec2 FragTexCoords;

uniform vec3 CameraPosition;

struct DirectionalLight
{
	vec3 colour;
	vec3 direction;
};
uniform int DirectionalLightCount;
uniform DirectionalLight DirectionalLights[4];

struct LightObject
{
	vec3 colour;
	vec3 position;
	vec3 direction;
	float range;
	vec2 angle; // X component is inner angle, Y component is outer angle. 0 degree outer angle means point light
	
	int shadowMapCount;
	int softShadows; // this is basically a bool but uniforms can't be bools so using an int
	int shadowMapIndices[6];
};
uniform int LightObjectCount;
uniform LightObject LightObjects[4];

in vec4 FragPosLightSpace[24];
uniform sampler2DArray ShadowMaps;

uniform sampler2D ColourMap;
uniform vec3 ColourTint;

uniform sampler2D NormalMap;

uniform float AlphaCutoff;

uniform uvec2 ID;

uniform int Selected;

uniform vec4 HighlightColour;

uniform float Time;

#define HEX_GRID_RADIUS 14
uniform sampler2D FogMap;
uniform vec3 FogColour;
uniform float FogRadius;
uniform float FogGradientRange;

// Output
layout (location = 0) out vec4 FragColour;
layout (location = 1) out vec4 PositionColour;
layout (location = 2) out uvec2 IDColour;

float ShadowCalculation(int lightObjectIndex, vec3 lightDirection);

float Remap01(float value, float vMin, float vMax);
float Remap(float value, float min1, float max1, float min2, float max2);
double RemapD(double value, double min1, double max1, double min2, double max2);

float Simplex2D(vec2 v);

void main() // Fragment
{	
	// Material Inputs
	vec4 colourRGBA = texture(ColourMap, FragTexCoords) * vec4(ColourTint, 1.0);
	vec3 colour = colourRGBA.rgb;
	float alpha = colourRGBA.a;
	vec3 normal = texture(NormalMap, FragTexCoords).rgb; normal = normalize(TBN * (normal * 2.0 - 1.0));
	
	float fogSideLength = textureSize(FogMap, 0).x;
	float hexSize = fogSideLength / (HEX_GRID_RADIUS * 2 + 1);
	vec2 fogCoord = (vec2(fogSideLength * 0.5) + FragPos.xz * vec2(hexSize)) / fogSideLength + (Simplex2D(5 * vec2(FragPos.x + 0.05 * Time, FragPos.y + 0.025 * Time)) * 2 / fogSideLength);
	vec2 fogData = texture(FogMap, fogCoord, 0).rg;
	double fogValue = fogData.r * 10.0 + fogData.g;
	
	if (alpha <= AlphaCutoff) discard;
	
	vec3 viewDirection = normalize(CameraPosition - FragPos);
	
	
	// ------------------------------------------------------------------------ //
	// ------------------------- Phoenix Toon Shading ------------------------- //
	// ------------------------------------------------------------------------ //

	// spot light
	vec3 lightDirection = normalize(LightObjects[0].position - FragPos);
	//shadow
	float shadow = ShadowCalculation(0, lightDirection);
	shadow = 1.0 - shadow;
	
	// Variables for Toon Shading
	vec3 toonRampTinting = vec3(0.333, 0.260, 0.462);
	float tintingAmbient = 0.3;
	
	float lightIntensity = Remap(clamp(shadow, 0.4, 0.5), 0.4, 0.5, 0.0, 1.0);
	
	vec3 light = lightIntensity * LightObjects[0].colour;
			
	// FINAL RESULT
	vec3 toonResult = colour * (toonRampTinting + light + vec3(0.01));
	toonResult *= tintingAmbient;
	
	
	FragColour = vec4(toonResult, 1.0);
	
	// if tile is selected
	if (Selected == 1)
	{
		FragColour.rgb *= 5;
		FragColour.rgb += vec3(0.7, 0.3, 1) * min((1 / abs(dot(viewDirection, normal))), 10);
		FragColour.rgb /= 6;
	}
	
	const float exponent = 3;
	const float intensity = 0.5;
	float highlightAmount = pow(1.0 - abs(dot(viewDirection, normal)), exponent) * intensity;
	FragColour.rgb += FragColour.rgb * HighlightColour.rgb * HighlightColour.a * highlightAmount;
	
	
	PositionColour = vec4(ObjectSpaceFragPos, 1.0);
	IDColour = ID;
	
	
	double inner = FogRadius - FogGradientRange;
	double outer = FogRadius;
	double fogFactor = RemapD(clamp(fogValue, inner, outer), inner, outer, 0, 1);
	
	if (fogFactor > 0)
	{
		IDColour = uvec2(0, 0);
		fogFactor = 1;
	}
	
	FragColour.rgb = vec3(mix(FragColour.rgb, FogColour, fogFactor));
}


float ShadowCalculation(int lightObjectIndex, vec3 lightDirection)
{
	int mapIndex = 0;
	switch(LightObjects[lightObjectIndex].shadowMapCount)
	{
		case 0: return 0.0;
		case 1:
			mapIndex = LightObjects[lightObjectIndex].shadowMapIndices[0];
			break;
		case 6:
			// Figure out which map to use idk
			//mapIndex = LightObjects[lightObjectIndex].shadowMapIndices[0]; // temporary
			break;
	}
	
	vec3 coords = FragPosLightSpace[mapIndex].xyz / FragPosLightSpace[mapIndex].w;
	coords = coords * 0.5 + 0.5;
	
	if (coords.z > 1.0) return 0.0;
		
	float currentDepth = coords.z;
	
	float shadow = 0.0;
	float shadowBias = 0.02;
	
	if (LightObjects[lightObjectIndex].softShadows == 0) // Hard Shadows
	{
		float closestDepth = texture(ShadowMaps, vec3(coords.xy, mapIndex)).r;
		shadow = currentDepth - shadowBias > closestDepth ? 1.0 : 0.0; // 1 means no light, 0 means light
	}
	else // Soft Shadows
	{
		vec2 texelSize = vec2(1.0 / textureSize(ShadowMaps, 0)) * vec2(1 + 1 * Simplex2D(FragPos.xz * 75));
		
		for (float x = -3.5; x <= 3.5; x += 1.0)
		{
			for (float y = -3.5; y <= 3.5; y += 1.0)
			{
				float pcfDepth = texture(ShadowMaps, vec3(coords.xy + vec2(x,y) * texelSize, mapIndex)).r;
				shadow += currentDepth - shadowBias > pcfDepth ? 1.0 : 0.0; // 1 means no light, 0 means light
			}
		}
		
		shadow /= 64.0;
	}
	
	return shadow;
}

float Remap01(float value, float vMin, float vMax)
{
	return (value - vMin) / (vMax - vMin);
}
float Remap(float value, float min1, float max1, float min2, float max2)
{
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}
double RemapD(double value, double min1, double max1, double min2, double max2)
{
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}



/// Simplex 2D Noise
/*
 * Description : Array and textureless GLSL 2D simplex noise function.
 *      Author : Ian McEwan, Ashima Arts.
 *  Maintainer : ijm
 *     Lastmod : 20110822 (ijm)
 *     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
 *               Distributed under the MIT License.
 *					  Copyright (C) 2011 by Ashima Arts (Simplex noise)
 *					  Copyright (C) 2011 by Stefan Gustavson (Classic noise)
 *					  
 *					  Permission is hereby granted, free of charge, to any person obtaining a copy
 *					  of this software and associated documentation files (the "Software"), to deal
 *					  in the Software without restriction, including without limitation the rights
 *					  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *					  copies of the Software, and to permit persons to whom the Software is
 *					  furnished to do so, subject to the following conditions:
 *					  
 *					  The above copyright notice and this permission notice shall be included in
 *					  all copies or substantial portions of the Software.
 *					  
 *					  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *					  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *					  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *					  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *					  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *					  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *					  THE SOFTWARE.
 *               https://github.com/ashima/webgl-noise
 */
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float Simplex2D(vec2 v)
  {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
// First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

// Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

// Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

// Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
///