#version 460

in vec3 Colour;

out vec4 FragColour;


void main() // Fragment
{	
	FragColour = vec4(Colour, 1.0);
}