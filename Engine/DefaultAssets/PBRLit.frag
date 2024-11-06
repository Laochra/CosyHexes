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

uniform sampler2D RMAOMap; // Roughness, Metallic, Ambient Occlusion
uniform vec3 EmissionColour;
uniform float EmissionIntensity;

uniform float AlphaCutoff;

uniform uvec2 ID;

uniform int Selected;

uniform vec4 HighlightColour;

#define HEX_GRID_RADIUS 14
uniform sampler2D FogMap;
uniform vec3 FogColour;
uniform float FogRadius;
uniform float FogGradientRange;

// Output
layout (location = 0) out vec4 FragColour;
layout (location = 1) out vec4 PositionColour;
layout (location = 2) out uvec2 IDColour;

float NormalDistribution(vec3 N, vec3 H, float a); // Trowbridge-Reitz GGX Normal Distribution Approximation
float GeometryGGX(float NdotV, float k); // Schick-GGX Geometry Approximation
float Geometry(vec3 N, vec3 V, vec3 L, float k); // Smith Geometry Approximation
vec3 Fresnel(float cosTheta, vec3 F0); // Fresnel-Schlick Fresnel Approximation
vec3 ReflectanceEquation(vec3 colour, vec3 normal, float roughness, float metallic, float ao, vec3 viewDirection, vec3 lightDirection, float attenuation, vec3 lightColour, vec3 F0);

float ShadowCalculation(int lightObjectIndex, vec3 lightDirection);

float Remap01(float value, float vMin, float vMax);
float Remap(float value, float min1, float max1, float min2, float max2);
double RemapD(double value, double min1, double max1, double min2, double max2);

void main() // Fragment
{	
	// Material Inputs
	vec4 colourRGBA = texture(ColourMap, FragTexCoords) * vec4(ColourTint, 1.0);
	vec3 colour = colourRGBA.rgb;
	float alpha = colourRGBA.a;
	vec3 normal = texture(NormalMap, FragTexCoords).rgb; normal = normalize(TBN * (normal * 2.0 - 1.0));
	vec4 rmao = texture(RMAOMap, FragTexCoords);
	float roughness = rmao.r;
	float metallic = rmao.g;
	float ao = rmao.b;
	vec3 emission = rmao.a * EmissionColour * EmissionIntensity;
	
	float fogSideLength = textureSize(FogMap, 0).x;
	float hexSize = fogSideLength / (HEX_GRID_RADIUS * 2 + 1);
	vec2 fogCoord = (vec2(fogSideLength * 0.5) + FragPos.xz * vec2(hexSize)) / fogSideLength;
	vec2 fogData = texture(FogMap, fogCoord, 0).rg;
	double fogValue = fogData.r * 10.0 + fogData.g;
	
	if (alpha <= AlphaCutoff) discard;
	
	vec3 viewDirection = normalize(CameraPosition - FragPos);
	
	vec3 F0 = vec3(0.04);
	F0 = mix(F0, colour, metallic);
	
	// Reflectance Equation
	vec3 Lo = vec3(0.0);
	for (int i = 0; i < min(DirectionalLightCount, 4); i++) // DirectionalLights
	{
		float attenuation = (DirectionalLights[i].colour != vec3(0.0)) ? 1.0 : 0.0;
		Lo += ReflectanceEquation(colour, normal, roughness, metallic, ao, viewDirection, -DirectionalLights[i].direction, attenuation, DirectionalLights[i].colour, F0);
	}
	for (int i = 0; i < min(LightObjectCount, 4); i++) // LightObjects
	{
		float d = length(LightObjects[i].position - FragPos);
		float dSqr = d * d;
		float attenuation = clamp(LightObjects[i].range * (1.0 / dSqr) * (1.0 / d), 0.0, 1.0);
		
		vec3 lightDirection = normalize(LightObjects[i].position - FragPos);
		if (LightObjects[i].angle.y != 1.0) // Check for no angle. 1.0 is the cosine of 0 degrees
		{
			float theta = dot(LightObjects[i].direction, lightDirection);
			float epsilon = LightObjects[i].angle.x - LightObjects[i].angle.y;
			attenuation *= clamp((theta - LightObjects[i].angle.y) / epsilon, 0.0, 1.0);
		}
		
		float shadow = ShadowCalculation(i, lightDirection);
		attenuation *= 1.0 - shadow;
		
		Lo += ReflectanceEquation(colour, normal, roughness, metallic, ao, viewDirection, lightDirection, attenuation, LightObjects[i].colour, F0);
	}
	
	
	// ------------------------------------------------------------------------ //
	// ------------------------- Phoenix Toon Shading ------------------------- //
	// ------------------------------------------------------------------------ //
	
	// Toon variables 
	
	float toonRampOffset = 0.5; 
	float toonRampSmoothness = 0.3;
	vec4 toonRampTinting = vec4(1.0, 0.0, 0.0, 1.0);
	float tintingAmbient = 1.0;
	
	// 
	
	// lighting equation for toon ramp, override default pbr
	// toon lighting output variables
	float toonRamp = 0.0;
	vec3 toonRampOutput = vec3(0.0);
	
	// directional lighting
	// for (int i = 0; i < min(DirectionalLightCount, 4); i++) {
		// DirectionalLight currentLight = DirectionalLights[i];
		// // dot product for toon ramp
		// float d = dot(N, -DirectionalLights[i].direction);
		
		// // smoothstep make smooth based on variables 
		// toonRamp += smoothstep(toonRampOffset, toonRampOffset + toonRampSmoothness, d);
		// toonRampOutput = DirectionalLights[i].colour * (toonRamp * toonRampTinting.xyz) + tintingAmbient;
	// }
	
	// spot light
	vec3 lightDirection = normalize(LightObjects[0].position - FragPos);
	float d = dot(N, lightDirection);
	toonRamp += smoothstep(toonRampOffset, toonRampOffset + toonRampSmoothness, d);
	//toonRampOutput = LightObjects[0].colour * (toonRamp * toonRampTinting.xyz) + tintingAmbient;
	toonRampOutput = LightObjects[0].colour * (toonRamp) + tintingAmbient;
	
	toonRampOutput *= colour * ao;
	
	// NOTE: multiply with shadows here 
	
	float shadow = ShadowCalculation(0, lightDirection);
	vec3 shadowOutput = vec3(0.0);
	shadowOutput *= 1.0 - shadow;
	toonRampOutput = mix(toonRampOutput, ((toonRampOutput * toonRampTinting.xyz) + tintingAmbient), shadowOutput);
	
	
	vec3 ambientResult = vec3(0.03) * colour * ao;
	vec3 colourResult = ambientResult + Lo;
	
	FragColour = vec4(toonRampOutput, 1);
	
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
	
	FragColour.rgb = vec3(mix(FragColour.rgb, FogColour, fogFactor));
	
	// Display Surface Normals
	//FragColour = vec4(N, 1);
	
	// Display Texture Coords
	//FragColour = vec4(FragTexCoords, 0, 1);
	
	// Display Colour Map
	//FragColour = vec4(colour, 1);
	
	// Display Normal Map
	//FragColour = vec4(normal, 1);
	
	// Display RMAO Map
	//FragColour = vec4(roughness, metallic, ao, 1);
	
	// Display Ambient Result
	//FragColour = vec4(ambientResult, 1);
	
	// Display Lo
	//FragColour = vec4(Lo, 1.0);
	
	// Display Colour Result
	//FragColour = vec4(colourResult, 1);
	
	// Display Depth
	//float near = 0.01;
	//float far = 10.0;
	//float z = gl_FragCoord.z * 2.0 - 1.0;
	//float depth = (2.0 * near * far) / (far + near - z * (far - near));
	//FragColour = vec4(vec3(depth / far), 1);
}



float NormalDistribution(vec3 N, vec3 H, float a) // Trowbridge-Reitz GGX Normal Distribution Approximation
{
	float aSqr = a * a;
	float NdotH = max(dot(N, H), 0.0);
	float NdotHSqr = NdotH * NdotH;
	
	float denominator = (NdotHSqr * (aSqr - 1.0) + 1.0);
	denominator = PI * denominator * denominator;
	
	return aSqr / denominator;
}

float GeometryGGX(float NdotV, float k) // Schick-GGX Geometry Approximation
{
	float denominator = NdotV * (1.0 - k) + k;
	
	return NdotV / denominator;
}
float Geometry(vec3 N, vec3 V, vec3 L, float k) // Smith Geometry Approximation
{
	float NdotV = max(dot(N, V), 0.0);
	float NdotL = max(dot(N, L), 0.0);
	
	return GeometryGGX(NdotV, k) * GeometryGGX(NdotL, k);
}

vec3 Fresnel(float cosTheta, vec3 F0) // Fresnel-Schlick Fresnel Approximation
{
	return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

vec3 ReflectanceEquation(vec3 colour, vec3 normal, float roughness, float metallic, float ao, vec3 viewDirection, vec3 lightDirection, float attenuation, vec3 lightColour, vec3 F0)
{
	// Calculate Per-Light Radiance
	
	vec3 H = normalize(viewDirection + lightDirection);
	vec3 radiance = lightColour * attenuation;
	
	// Cook-Torrance BRDF
	float NDF = NormalDistribution(normal, H, roughness);
	float G = Geometry(normal, viewDirection, lightDirection, roughness);
	vec3 F = Fresnel(max(dot(H, viewDirection), 0.0), F0);
	
	vec3 kS = F;
	vec3 kD = vec3(1.0) - kS;
	kD *= 1.0 - metallic;
	
	vec3 numerator = NDF * G * F;
	float denominator = 4.0 * max(dot(normal, viewDirection), 0.0) * max(dot(normal, lightDirection), 0.0) + 0.0001;
	vec3 specular = numerator / denominator;
	
	// Return amount to add
	float NdotL = max(dot(normal, lightDirection), 0.0);
	return (kD * colour / PI + specular) * radiance * NdotL;
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
	float shadowBias = 0.005;
	
	if (LightObjects[lightObjectIndex].softShadows == 0) // Hard Shadows
	{
		float closestDepth = texture(ShadowMaps, vec3(coords.xy, mapIndex)).r;
		shadow = currentDepth - shadowBias > closestDepth ? 1.0 : 0.0; // 1 means no light, 0 means light
	}
	else // Soft Shadows
	{
		vec2 texelSize = vec2(1.0 / textureSize(ShadowMaps, 0));
		for (float x = -1.5; x <= 1.5; x += 1.0)
		{
			for (float y = -1.5; y <= 1.5; y += 1.0)
			{
				float pcfDepth = texture(ShadowMaps, vec3(coords.xy + vec2(x,y) * texelSize, mapIndex)).r;
				shadow += currentDepth - shadowBias > pcfDepth ? 1.0 : 0.0; // 1 means no light, 0 means light
			}
		}
		
		shadow /= 16.0;
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