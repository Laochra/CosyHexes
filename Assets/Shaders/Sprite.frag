#version 460

uniform sampler2D SpriteTexture;

in vec2 FragTexCoords;

out vec4 Colour;

void main() // Frag
{
	Colour = texture(SpriteTexture, FragTexCoords);
}
