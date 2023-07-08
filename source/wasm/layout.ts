export const OFFSET = {
	TYPE     : 0*4, // pointer to string for node name
	TYPE_LEN : 1*4, // pointer to string for node name
	START    : 2*4, // index of consumption start
	END      : 3*4, // index of consumption end
	COUNT    : 4*4, // number of child nodes / literal byte length
	DATA     : 5*4, // offset for first child
}