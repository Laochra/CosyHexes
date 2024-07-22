#version 460

in vec4 ColourTint;
in vec2 FragTexCoords;

uniform sampler2D Sprite;
uniform float AlphaCutoff;

layout (location = 0) out vec4 FragColour;
layout (location = 1) out vec4 BrightColour;

void main() // Frag
{
	vec4 spriteColour = texture(Sprite, FragTexCoords);
	
	FragColour = spriteColour * ColourTint;
	
	if (FragColour.a <= AlphaCutoff) discard;
	if (AlphaCutoff > 0.0) FragColour.a = 1.0;
	
	FragColour = pow(FragColour, vec4(2.2));
	
	const vec3 brightnessConstant = vec3(0.2126, 0.7152, 0.0722);
	float brightness = dot(FragColour.rgb, brightnessConstant);
	BrightColour = vec4(brightness > 1.0 ? vec4(FragColour.xyz, min(brightness - 1.0, 1.0)) : vec4(0.0));
}
