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


float SimplexNoise(vec2 v); // Simplex 2D noise by Ian McEwan, Stefan Gustavson (https://github.com/stegu/webgl-noise)

void main() // Vertex
{
	FragPos = (ModelMatrix * Position).xyz;
	ObjectSpaceFragPos = Position.xyz;
	
	float offsetFactor = min((abs(Position.x) + abs(Position.z)) * 0.5 + 2 * abs(Position.y), 0.5) * 0.05;
	float leafSwayFactor = sin(SimplexNoise(vec2(FragPos.x, FragPos.z) * 0.1) + Time) * offsetFactor;
	vec3 leafSway = vec3(leafSwayFactor, 0, 0);
	
	FragPos = (ModelMatrix * Position + vec4(leafSway, 0)).xyz;
	ObjectSpaceFragPos = (inverse(ModelMatrix) * (ModelMatrix * Position + vec4(leafSway, 0))).xyz;
	
	for (int i = 0; i < LightSpaceMatrixCount; i++)
	{
		FragPosLightSpace[i] = LightSpaceMatrices[i] * vec4(FragPos, 1.0);
	}
	
	N = normalize((ModelMatrix * Normal).xyz);
	vec3 T = normalize((ModelMatrix * Tangent).xyz);
	vec3 B = normalize((ModelMatrix * BiTangent).xyz);
	
	TBN = mat3(T, B, N);
	
	FragTexCoords = TexCoords;
	gl_Position = ProjectionViewModel * inverse(ModelMatrix) * (ModelMatrix * Position + vec4(leafSway, 0));
}


// Simplex 2D noise by Ian McEwan, Stefan Gustavson (https://github.com/stegu/webgl-noise)
vec3 permute(vec3 x)
{
	return mod(((x*34.0)+1.0)*x, 289.0);
}
vec4 taylorInvSqrt(vec4 r)
{
	return 1.79284291400159 - 0.85373472095314 * r;
}
float SimplexNoise(vec2 v)
{
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
							-0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
