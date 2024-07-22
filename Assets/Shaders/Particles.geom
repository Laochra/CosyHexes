#version 460

layout(points) in;
layout(triangle_strip, max_vertices = 4) out;

struct Inputs
{
	mat4 Projection;
	mat4 ModelView;
	vec4 Colour;
	vec2 Size;
};
in Inputs GeomInputs[];

out vec4 ColourTint;
out vec2 FragTexCoords;

void main() // Geometry
{	
	if (gl_in[0].gl_Position.a == 0.0)
	{
		gl_Position = gl_in[0].gl_Position;
		ColourTint = vec4(0.0);
		FragTexCoords = vec2(0.0);
		EmitVertex();
		EmitVertex();
		EmitVertex();
		EmitVertex();
		return;
	}
	
	vec3 position = gl_in[0].gl_Position.xyz;
	vec4 particleWorldPosition = GeomInputs[0].ModelView * vec4(gl_in[0].gl_Position.xyz, 1.0);
	
	float halfWidth = GeomInputs[0].Size.x * 0.5;
	float halfHeight = GeomInputs[0].Size.y * 0.5;
	
	ColourTint = GeomInputs[0].Colour;
	
	// Bottom Left
	gl_Position 	= GeomInputs[0].Projection * (particleWorldPosition + vec4(-halfWidth, -halfHeight, 0, 0));
	FragTexCoords 	= vec2(0.0, 1.0);
	EmitVertex();
	
	// Bottom Right
	gl_Position 	= GeomInputs[0].Projection * (particleWorldPosition + vec4(halfWidth, -halfHeight, 0, 0));
	FragTexCoords 	= vec2(1.0, 1.0);
	EmitVertex();
	
	// Top Left
	gl_Position 	= GeomInputs[0].Projection * (particleWorldPosition + vec4(-halfWidth, halfHeight, 0, 0));
	FragTexCoords 	= vec2(0.0, 0.0);
	EmitVertex();
	
	// Top Right
	gl_Position 	= GeomInputs[0].Projection * (particleWorldPosition + vec4(halfWidth, halfHeight, 0, 0));
	FragTexCoords 	= vec2(1.0, 0.0);
	EmitVertex();
	
	EndPrimitive();
}



//transform from emitter to world space (model matrix)
//transform from world to view space (view matrix)
//I recommend doing the offset here
//transform from view space to clip space (projection matrix)