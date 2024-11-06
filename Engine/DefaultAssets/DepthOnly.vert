#version 460

layout( location = 0) in vec4 Position;
layout( location = 1) in vec4 Normal;
layout( location = 2) in vec4 Tangent;
layout( location = 3) in vec4 BiTangent;
layout( location = 4) in vec2 TexCoords;

uniform mat4 ProjectionViewModel;

out vec2 FragTexCoords;

void main() // Vertex
{
	gl_Position = ProjectionViewModel * Position;
	FragTexCoords = TexCoords;
}
