#version 460

uniform sampler2DArray Sprites;

uniform float AcceptedHalfAngle;
uniform vec2 HoveredSliceDirection;

in vec2 FragDirection;
in vec2 FragTexCoords;

out vec4 Colour;

void main() // Frag
{
	if (HoveredSliceDirection == vec2(0.0, 0.0) || dot(normalize(FragDirection), HoveredSliceDirection) <= 1.0 - AcceptedHalfAngle)
	{
		Colour = texture(Sprites, vec3(FragTexCoords, 0));
	}
	else
	{
		Colour = texture(Sprites, vec3(FragTexCoords, 1));
	}
	if (Colour.a == 0.0) discard;
}
