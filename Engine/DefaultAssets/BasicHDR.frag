#version 460

uniform sampler2D HDRTexture;
uniform sampler2D CurrentColourBuffer;
uniform float Exposure;

in vec2 FragTexCoords;

out vec4 FragColour;

void main() // Fragment
{
	vec4 hdrColour = texture(HDRTexture, FragTexCoords);
	vec4 currentColour = texture(CurrentColourBuffer, FragTexCoords);
	
	vec4 remapped = vec4(vec3(1.0) - exp(-hdrColour.rgb * Exposure), hdrColour.a);
	remapped.xyz = pow(remapped.rgb, vec3(0.45)); // Colour to the power of 1/2.2 to return to non-linear space
	
	FragColour = remapped;
}
