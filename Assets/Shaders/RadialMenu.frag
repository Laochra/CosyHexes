#version 460

uniform sampler2DArray Sprites;

uniform int HoveredSlice;
uniform int SliceCount;
uniform int SliceEnabledFlags;
uniform vec2 SliceDirections[16];

in vec2 FragDirection;
in vec2 FragTexCoords;

out vec4 Colour;

void main() // Frag
{
	// Figure out the slice this frag is a part of based on highest dot product with SliceDirections[i]
	int currentSlice = 0;
	vec2 normalisedFragDir = normalize(FragDirection);
	float currentAngle = dot(normalisedFragDir, SliceDirections[0]);
	for (int i = 1; i < SliceCount; i++)
	{
		float newAngle = dot(normalisedFragDir, SliceDirections[i]);
		if (newAngle > currentAngle)
		{
			currentSlice = i;
			currentAngle = newAngle;
		}
	}
	
	
	if (((SliceEnabledFlags >> currentSlice) & 1) == 0)
	{
		// Use disabled sprite
		Colour = texture(Sprites, vec3(FragTexCoords, 2));
	}
	else if (currentSlice == HoveredSlice)
	{
		// Use hovered sprite
		Colour = texture(Sprites, vec3(FragTexCoords, 1));
	}
	else
	{
		// Use regular sprite
		Colour = texture(Sprites, vec3(FragTexCoords, 0));
	}
	
	
	if (Colour.a == 0.0) discard;
}
