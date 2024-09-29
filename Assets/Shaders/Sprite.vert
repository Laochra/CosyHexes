#version 460

layout(location = 0) in vec2 Position;
layout(location = 1) in vec2 TexCoords;

uniform vec2 SpritePos;
uniform float Aspect;
uniform float Scale;

out vec2 FragTexCoords;

void main() // Vert
{
	gl_Position = vec4(SpritePos.x + (Position.x * Scale * Aspect) , SpritePos.y + (Position.y * Scale), 0, 1);
	FragTexCoords = TexCoords;
}
