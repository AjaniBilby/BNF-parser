export class ParseError {
	stack: string[]
	msg: string
	ref: ReferenceRange

	constructor(msg: string, ref: ReferenceRange) {
		this.stack = [];
		this.msg = msg;
		this.ref = ref;
	}

	add_stack(elm: string) {
		this.stack.unshift(elm);
	}

	hasStack(): boolean {
		return this.stack.length > 0;
	}

	toString() {
		return `Parse Error: ${this.msg} ${this.ref.toString()}` +
			(this.hasStack() ? "\nstack: " + this.stack.join(" -> ") : "");
	}
}


export class SyntaxNode {
	type : string;
	start: number;
	end  : number;
	count: number;
	value: SyntaxNode[] | string;
	ref: ReferenceRange

	constructor (type: string, start: number, end: number, count: number, ref: ReferenceRange) {
		this.type  = type;
		this.start = start;
		this.end   = end;
		this.count = count;
		this.value = [];
		this.ref   = ref;
	}
}

export class Reference {
	line: number;
	col: number;
	index: number;

	constructor(line: number, col: number, index: number) {
		this.line = line;
		this.col = col;
		this.index = index;
	}

	advance(newline: boolean = false) {
		if (newline) {
			this.col = 1;
			this.line++;
			this.index++;
		} else {
			this.index++;
			this.col++;
		}
	}

	valueOf() {
		return this.index;
	}

	clone(): Reference {
		return new Reference(this.line, this.col, this.index);
	}

	toString(): string {
		return `(${this.line}:${this.col})`;
	}

	static blank() {
		return new Reference(1,1,0);
	}
}



export class ReferenceRange {
	start: Reference;
	end: Reference;

	constructor(from: Reference, to: Reference) {
		this.start = from;
		this.end = to;
	}

	span(other: ReferenceRange) {
		if (other.start.index < this.start.index) {
			this.start = other.start;
		}
		if (other.end.index > this.end.index) {
			this.end = other.end;
		}
	}

	valueOf () {
		return this.end.index;
	}

	clone(): ReferenceRange {
		return new ReferenceRange(this.start.clone(), this.end.clone());
	}

	toString(): string {
		return `${this.start.toString()} -> ${this.end.toString()}`;
	}

	static union(a: ReferenceRange, b: ReferenceRange){
		return new ReferenceRange(
			a.start.index < b.start.index ? a.start.clone() : b.start.clone(), // Smallest
			a.end.index   > b.end.index   ? a.end.clone()   : b.end.clone(),   // Largest
		);
	}

	static intersection(a: ReferenceRange, b: ReferenceRange){
		let start = a.start.index > b.start.index ? a.start.clone() : b.start.clone() // Largest
		let end   = a.end.index   < b.end.index   ? a.end.clone()   : b.end.clone()   // Smallest

		return new ReferenceRange(
			// Make sure start and end haven't switched
			start.index > end.index ? start : end,
			start.index > end.index ? end   : start,
		);
	}

	static blank() {
		return new ReferenceRange(Reference.blank(), Reference.blank());
	}
}

export function DecodeBase64(base64: string) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	let bufferLength = base64.length * 0.75,
		len = base64.length,
		i,
		p = 0,
		encoded1,
		encoded2,
		encoded3,
		encoded4;

	if (base64[base64.length - 1] === '=') {
			bufferLength--;
			if (base64[base64.length - 2] === '=') {
					bufferLength--;
			}
	}

	let bytes = new Uint8Array(bufferLength);

	for (i = 0; i < len; i += 4) {
		encoded1 = chars.indexOf(base64[i]);
		encoded2 = chars.indexOf(base64[i + 1]);
		encoded3 = chars.indexOf(base64[i + 2]);
		encoded4 = chars.indexOf(base64[i + 3]);

		bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
		bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
		bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
	}

	return bytes;
}