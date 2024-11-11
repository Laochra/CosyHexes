#version 460

layout( location = 0) in vec4 Position;
layout( location = 1) in vec4 Normal;
layout( location = 2) in vec4 Tangent;
layout( location = 3) in vec4 BiTangent;
layout( location = 4) in vec2 TexCoords;

out vec3 FragPos;
out vec3 ObjectSpaceFragPos;

out vec3 N;
out mat3 TBN;

out vec2 FragTexCoords;

uniform mat4 ProjectionViewModel;

uniform mat4 ModelMatrix;

uniform float Time;

uniform int LightSpaceMatrixCount;
uniform mat4 LightSpaceMatrices[24];
out vec4 FragPosLightSpace[24];

void main() // Vertex
{	
	FragPos = (ModelMatrix * Position).xyz;
	ObjectSpaceFragPos = Position.xyz;
	
	for (int i = 0; i < LightSpaceMatrixCount; i++)
	{
		FragPosLightSpace[i] = LightSpaceMatrices[i] * vec4(FragPos, 1.0);
	}
	
	N = normalize((ModelMatrix * Normal).xyz);
	vec3 T = normalize((ModelMatrix * Tangent).xyz);
	vec3 B = normalize((ModelMatrix * BiTangent).xyz);
	
	TBN = mat3(T, B, N);
	
	FragTexCoords = TexCoords;
	gl_Position = ProjectionViewModel * Position;
}