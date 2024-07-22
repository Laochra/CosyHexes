#version 460

layout( location = 0) in vec4 Position;
layout( location = 1) in vec4 Normal;
layout( location = 2) in vec4 Tangent;
layout( location = 3) in vec4 BiTangent;
layout( location = 4) in vec2 TexCoords;

uniform mat4 ProjectionViewModel;

uniform uvec2 GUID;

out flat uvec2 GUIDColour;

void main() // Vertex
{
	gl_Position = ProjectionViewModel * Position;
	
	GUIDColour = GUID;
}
