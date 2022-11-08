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
			this.col = 0;
			this.line++;
			this.index++;
		} else {
			this.index++;
			this.col++;
		}
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

	clone(): ReferenceRange {
		return new ReferenceRange(this.start.clone(), this.end.clone());
	}

	toString(): string {
		return `${this.start.toString()} -> ${this.end.toString()}`;
	}
}

type SyntaxValue = SyntaxNode[] | string;
export class SyntaxNode {
	type: string;
	value: SyntaxValue;
	ref: ReferenceRange;

	constructor(type: string, value: SyntaxValue, ref: ReferenceRange) {
		this.type = type;
		this.ref = ref;

		this.value = value;
	}


	flat(): string {
		if (Array.isArray(this.value)) {
			return this.value
				.map(x => x.flat())
				.reduce((prev: string, x: string) => prev+x, "");
		} else {
			return this.value;
		}
	}
}


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