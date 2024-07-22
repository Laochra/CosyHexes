#version 460

void main() // Frag
{
	gl_FragDepth = gl_FragCoord.z;
}
