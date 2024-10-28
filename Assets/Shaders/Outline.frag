#version 460

uniform sampler2D ColourMap;
uniform sampler2D PositionMap;
uniform sampler2D IDMap;
uniform vec2 PixelSize;

uniform float outlineThickness = 2.0;

uniform sampler3D NoiseMap;

in vec2 FragTexCoords;

out vec4 Colour;

vec3 ObjectSpacePosLookup(vec2 uvs)
{
	return texture(PositionMap, uvs).xyz;
}

int IDLookup(vec2 uvs)
{
	return int(texture(IDMap, uvs).x);
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
	vec3 screenColour = texture(ColourMap, FragTexCoords);
	
	// access ID lookup from IDMap
	// each object has their own ID
	int thisID = IDLookup(uvs);
	
	// tap the pixel/frag around each pixel/frag
	// box shape around each fragment use points
	// to sample colour later
	vec2 neighbourTaps[4] = vec2[4](
	vec2(0.5, 0.0), vec2(-0.5, 0.0), vec2(0.0, 0.5), vec2(0.0, -0.5));
	
	float outlineLevel = 0.0;
	
	// go around current pixel/frag compare ID
	for(int i = 0; i < 4; i++)
	{
		int otherID = IDLookup(uvs + neighbourTaps[i] * outlineThickness);
		if (otherID != thisID) outlineLevel = 1.0;
	}
	
	
	// declare outline colour
	// maybe make into uniform or 
	// write some code 
	vec3 outlineColour = vec3(0.0);
	
	Colour = vec4(mix(screenColour, outlineColour, outlineLevel),1.0);
}
