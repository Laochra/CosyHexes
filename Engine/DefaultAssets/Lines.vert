#version 460

layout (location = 0) in vec3 Position;
layout (location = 1) in vec3 VertColour;

uniform mat4 PVMatrix;

out vec3 Colour;

void main() // Vertex
{	
	Colour = VertColour;
	gl_Position = PVMatrix * vec4(Position, 1.0);
}