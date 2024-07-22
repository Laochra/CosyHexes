#version 460

// Active status is packed into the 4th component of position since it will always be 1.0 otherwise
layout (location = 0) in vec4 Position;
layout (location = 1) in vec4 Colour;
layout (location = 2) in vec2 Size;

uniform mat4 Projection;
uniform mat4 ModelView;

struct Outputs
{
	mat4 Projection;
	mat4 ModelView;
	vec4 Colour;
	vec2 Size;
};
out Outputs GeomInputs;

void main() // Vertex
{
	if (Position.a == 0)
	{
		gl_Position = vec4(0.0, 0.0, 1.0, 0.0);
		GeomInputs.Colour = vec4(0.0);
		return;
	}

	gl_Position = vec4(Position.xyz, 1.0);
	
	GeomInputs.Colour = Colour;
	GeomInputs.Projection = Projection;
	GeomInputs.ModelView = ModelView;
	GeomInputs.Size = Size;
}
