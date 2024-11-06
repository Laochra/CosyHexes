#version 460

uniform sampler2D ColourMap;
uniform float AlphaCutoff;

in vec2 FragTexCoords;

void main() // Frag
{
	if (texture(ColourMap, FragTexCoords, 0).a <= AlphaCutoff) discard;
	
	gl_FragDepth = gl_FragCoord.z;
}
