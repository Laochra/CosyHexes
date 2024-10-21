#version 460

uniform sampler2D ColourMap;
uniform sampler2D PositionMap;
uniform sampler2D IDMap;

uniform sampler3D NoiseMap;

in vec2 FragTexCoords;

out vec4 Colour;

void main() // Frag
{
	Colour = texture(ColourMap, FragTexCoords);
}
