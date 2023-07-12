import {
	Expression, Parser,
	Literal, Not, Omit, Gather, Select, Sequence
} from "../legacy/parser.js";


// Using a class for better V8 performance
class Mapping {
	readonly value: string;
	readonly bytes: Uint8Array;
	readonly offset: number;

	constructor(value: string, bytes: Uint8Array, offset: number) {
		this.value = value;
		this.bytes = bytes;
		this.offset = offset;

		Object.freeze(this);
	}
}


export default class LiteralMapping {
	encoder: TextEncoder;
	values: Mapping[];
	size: number;

	constructor() {
		this.encoder = new TextEncoder();
		this.values = [];
		this.size = 0;
	}

	addKey(val: string) {
		const bytes = this.encoder.encode(val);
		const res = this.values.find(x => x.value === val);
		if (res) return;

		this.values.push(new Mapping(val, bytes, this.size));
		this.size += bytes.byteLength;
	}

	getKey(val: string) {
		const res = this.values.find(x => x.value === val);
		if (res) return res;

		throw new Error(`Internal error: Unmapped literal ${val}`);
	}

	static Uint8ArraysEqual(a: Uint8Array, b: Uint8Array) {
		if (a.length != b.length) return false;

		for (let i=0; i<a.length; i++) {
			if (a[i] != b[i]) return false;
		}

		return true;
	}

	ingestBnf(bnf: Parser) {
		this.addKey("literal");
		this.addKey("(...)");
		this.addKey("(...)?");
		this.addKey("(...)*");
		this.addKey("(...)+");
		for (let [_, rule] of bnf.terms) {
			this.ingestBnfExpression(rule.seq);
			this.addKey(rule.name);
		}
	}

	ingestBnfExpression(expr: Expression) {
		if (expr instanceof Literal) {
			this.addKey(expr.value);
		} else if (expr instanceof Not || expr instanceof Omit || expr instanceof Gather) {
			this.ingestBnfExpression(expr.expr);
		} else if (expr instanceof Select || expr instanceof Sequence) {
			expr.exprs.forEach(x => this.ingestBnfExpression(x));
		}
	}
}