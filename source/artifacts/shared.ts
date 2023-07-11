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
	ref: null | ReferenceRange

	constructor (type: string, start: number, end: number, count: number) {
		this.type  = type;
		this.start = start;
		this.end   = end;
		this.count = count;
		this.value = [];
		this.ref = null;
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
}