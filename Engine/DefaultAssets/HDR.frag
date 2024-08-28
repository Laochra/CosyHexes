#version 460

uniform sampler2D HDRTexture;
uniform sampler2D BloomTexture;
uniform sampler2D GizmosTexture;
uniform sampler2D UITexture;
uniform sampler2D CurrentColourBuffer;
uniform float Exposure;
uniform int DisplayUI;

in vec2 FragTexCoords;

out vec4 FragColour;

void main() // Fragment
{
	vec4 currentColour = texture(CurrentColourBuffer, FragTexCoords);
	
	vec4 hdrColour = texture(HDRTexture, FragTexCoords);
	hdrColour = vec4(vec3(1.0) - exp(-hdrColour.xyz * Exposure), hdrColour.w);
	hdrColour.xyz = pow(hdrColour.xyz, vec3(0.45)); // Colour to the power of 1/2.2 to return to non-linear space
	FragColour = mix(currentColour, hdrColour, hdrColour.w);
	
	vec4 gizmosColour = texture(GizmosTexture, FragTexCoords);
	FragColour = mix(FragColour, gizmosColour, gizmosColour.w);
	
	vec4 bloomColour = texture(BloomTexture, FragTexCoords);
	FragColour += vec4(bloomColour.xyz * bloomColour.w, bloomColour.w);
	
	if (DisplayUI == 1)
	{
		vec4 uiColour = texture(UITexture, FragTexCoords);
		FragColour = mix(FragColour, uiColour, uiColour.w);
	}
}
