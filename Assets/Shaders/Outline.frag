#version 460

uniform sampler2D ColourMap;
uniform sampler2D PositionMap;
uniform usampler2D IDMap;
uniform vec2 PixelSize;

//uniform float outlineThickness = 20.0;

uniform sampler3D NoiseMap;

in vec2 FragTexCoords;

out vec4 Colour;

vec3 ObjectSpacePosLookup(vec2 uvs)
{
	return texture(PositionMap, uvs).xyz;
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



void main() // Frag
{
	// Get UV coords
	vec2 uvs = FragTexCoords;
	vec3 screenColour = texture(ColourMap, FragTexCoords).xyz;
	
	// access ID lookup from IDMap
	// each object has their own ID
	uvec2 thisID = IDLookup(uvs);
	
	// tap the pixel/frag around each pixel/frag
	// box shape around each fragment use points
	// to sample colour later
	vec2 neighbourTaps[4] = vec2[4](
	vec2(1.0, 0.0), vec2(-1.0, 0.0), vec2(0.0, 1.0), vec2(0.0, -1.0));
	
	float outlineThickness = 0.5;
	
	float outlineLevel = 0.0;
	
	// go around current pixel/frag compare ID
	for(int i = 0; i < 4; i++)
	{
		uvec2 otherID = IDLookup(uvs + neighbourTaps[i] * PixelSize * outlineThickness);
		if (otherID != thisID) outlineLevel = 1.0;
	}
	
	
	// declare outline colour
	// maybe make into uniform or 
	// write some code 
	vec3 outlineColour = vec3(0.0);
	
	Colour = vec4(mix(screenColour, outlineColour, outlineLevel),1.0);
	// Colour = vec4(thisID/1000.0, thisID, thisID, 1.0);
	// Colour = vec4(outlineLevel, outlineLevel, outlineLevel, 1.0);
}
