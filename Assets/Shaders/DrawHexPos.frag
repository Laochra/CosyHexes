#version 460

in flat ivec2 HexPosition;

out ivec4 Colour;

void main() // Frag
{
	Colour = ivec4(HexPosition.x, HexPosition.y, 0, 1);
}
