#version 460

in vec3 FragPos;
in vec3 ObjectSpaceFragPos;

in vec3 N;
in mat3 TBN;

in vec2 FragTexCoords;

// Output
layout (location = 0) out vec4 FragColour;
layout (location = 1) out vec4 PositionColour;
layout (location = 2) out uvec2 IDColour;

void main() // Fragment
{	
	discard;
}
