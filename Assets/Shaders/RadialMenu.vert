#version 460

layout(location = 0) in vec2 Position;
layout(location = 1) in vec2 TexCoords;

uniform float Aspect;
uniform float Scale;

out vec2 FragDirection;
out vec2 FragTexCoords;

void main() // Vert
{
	FragDirection = Position;
	gl_Position = vec4(Position.x * Aspect * Scale, Position.y * Scale, 0, 1);
	FragTexCoords = TexCoords;
}
