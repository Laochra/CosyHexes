#version 460

uniform sampler2D BrightTexture;

in vec2 FragTexCoords;

out vec4 FragColour;

void main() // Fragment
{
	vec2 texelSize = 1.0 / textureSize(BrightTexture, 0);
	
	const float range = 6.0;
	
	vec4 colourSum;
	int amountOfColours;
	for (int xOffset = int(-range); xOffset <= range; xOffset++)
	{
		for (int yOffset = int(-range); yOffset <= range; yOffset++)
		{
			vec2 offset = vec2(xOffset, yOffset);
			if (dot(offset, offset) <= range * range)
			{
				colourSum += texture(BrightTexture, FragTexCoords + vec2(xOffset * texelSize.x, yOffset * texelSize.y));
				amountOfColours++;
			}
		}
	}
	
	FragColour = colourSum / amountOfColours;
}
