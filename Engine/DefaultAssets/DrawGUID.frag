#version 460

in flat uvec2 GUIDColour;

out uvec2 Colour;

void main() // Frag
{
	Colour = GUIDColour;
}
