#version 460

in vec3 FragPos;
in vec3 ObjectSpaceFragPos;

in vec2 FragTexCoords;

uniform sampler2D ColourMap;
uniform vec3 ColourTint;

// Output
layout (location = 0) out vec4 FragColour;
layout (location = 1) out vec4 PositionColour;
layout (location = 2) out vec4 IDColour;


void main() // Fragment
{
	vec3 colour = texture(ColourMap, FragTexCoords).rgb * ColourTint;
	
	FragColour = vec4(colour, 1);
	
	PositionColour = vec4(ObjectSpaceFragPos, 1.0);
	IDColour = vec4(0.0);
	
	// Display Surface Normals
	//FragColour = vec4(N, 1);
	
	// Display Texture Coords
	//FragColour = vec4(FragTexCoords, 0, 1);
	
	// Display Depth
	//float near = 0.01;
	//float far = 10.0;
	//float z = gl_FragCoord.z * 2.0 - 1.0;
	//float depth = (2.0 * near * far) / (far + near - z * (far - near));
	//FragColour = vec4(vec3(depth / far), 1);
}