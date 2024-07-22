#version 460

uniform sampler2D HDRTexture;
uniform sampler2D BloomTexture;
uniform sampler2D GizmosTexture;
uniform sampler2D CurrentColourBuffer;
uniform float Exposure;

in vec2 FragTexCoords;

out vec4 FragColour;

void main() // Fragment
{
	vec4 hdrColour = texture(HDRTexture, FragTexCoords);
	vec4 bloomColour = texture(BloomTexture, FragTexCoords);
	vec4 gizmosColour = texture(GizmosTexture, FragTexCoords);
	vec4 currentColour = vec4(texture(CurrentColourBuffer, FragTexCoords).xyz, 1.0 - (hdrColour.w + gizmosColour.w));
	hdrColour += vec4(bloomColour.xyz * bloomColour.w, bloomColour.w);
	gizmosColour.xyz += bloomColour.xyz;
	
	vec4 remapped = vec4(vec3(1.0) - exp(-hdrColour.xyz * Exposure), hdrColour.w);
	remapped.xyz = pow(remapped.xyz, vec3(0.45)); // Colour to the power of 1/2.2 to return to non-linear space
	
	if (gizmosColour.w >= 1.0)
	{
		FragColour = gizmosColour;
		return;
	}
	
	FragColour = vec4(currentColour.xyz * currentColour.w, currentColour.w) +
					 vec4(remapped.xyz * remapped.w, remapped.w) +
					 vec4(gizmosColour.xyz * gizmosColour.w, gizmosColour.w);
}