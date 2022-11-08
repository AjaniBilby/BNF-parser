import {SyntaxNode, ParseError, Reference, ReferenceRange} from "./syntax";

export type Expression = Literal | CharRange | Term | Not | Omit | Gather | Select | Sequence;

function ParseExpression(json: any): Expression {
	switch (json['type'] as string) {
		case "literal": return new Literal(json);
		case "range": return new CharRange(json);
		case "term": return new Term(json);
		case "not": return new Not(json);
		case "omit": return new Omit(json);
		case "gather": return new Gather(json);
		case "select": return new Select(json);
		case "sequence": return new Sequence(json);
		default:
			throw new TypeError(`Unknown expression type "${json['type']}"`);
	}
}



export enum Count {
	One = "1",
	ZeroToOne = "?",
	ZeroToMany = "*",
	OneToMany = "+"
};
export function ParseCount(count: string): Count {
	switch(count) {
		case "1":	return Count.One;
		case "?":	return Count.ZeroToOne;
		case "*":	return Count.ZeroToMany;
		case "+":	return Count.OneToMany;
		default: throw new Error("Unknown count");
	}
}

function CountCheck(count: Number, mode: Count): boolean {
	if (count < 1 && (
		mode == Count.One ||
		mode == Count.OneToMany
	)) {
		return false;
	} else if (count > 1 && (
		mode == Count.ZeroToOne ||
		mode == Count.One
	)) {
		return false;
	} else {
		return true;
	}
}





export class Literal {
	value: string;
	count: Count;

	constructor(json: any) {
		this.value = json['value'];
		this.count = ParseCount(json['count']);
	}

	parse(input: string, ctx: Parser, cursor: Reference): SyntaxNode | ParseError {
		let start = cursor.clone();
		let consumption = 0;

		while (true) {
			if (consumption >= 1 && (this.count == Count.One || this.count == Count.ZeroToOne)) {
				break;
			}

			if (this.match(input, cursor)) {
				consumption++;
			} else {
				break;
			}
		}

		let range = new ReferenceRange(start, cursor);

		if (!CountCheck(consumption, this.count)) {
			return new ParseError(`Didn't consume the correct amount. ${consumption} ¬ ${this.count}`, range);
		}

		return new SyntaxNode("literal", input.slice(start.index, cursor.index), range);
	}

	match (input: string, cursor: Reference): Boolean {
		if (this.value.length == 0){
			return false;
		}

		for (let i=0; i<this.value.length; i++) {
			if (cursor.index >= input.length) {
				return false;
			}

			if (this.value[i] == input[cursor.index]) {
				cursor.advance(input[cursor.index] == "\n");
			} else {
				return false;
			}
		}

		return true;
	}

	serialize(): any {
		return {
			type: "literal",
			value: this.value,
			count: this.count
		};
	}
}

export class CharRange extends Literal {
	to: string;

	constructor(json: any) {
		super(json);
		this.to = json['to'];
	}

	match (input: string, cursor: Reference): Boolean {
		if (cursor.index >= input.length) {
			return false;
		}

		if (this.value <= input[cursor.index] && input[cursor.index] <= this.to) {
			cursor.advance(input[cursor.index] == "\n");
			return true;
		}

		return false;
	}

	matchChar(char: string, offset: number): boolean {
		return this.value <= char && char <= this.to;
	}

	serialize(): any {
		let out = super.serialize();
		out.type = "range";
		out.to = this.to;

		return out;
	}
}





export class Gather {
	expr: Expression;

	constructor(json: any) {
		this.expr = ParseExpression(json['expr']);
	}

	parse(input: string, ctx: Parser, cursor: Reference): SyntaxNode | ParseError {
		let res = this.expr.parse(input, ctx, cursor);
		if (res instanceof ParseError) {
			return res;
		}

		res.value = res.flat();
		return res;
	}

	serialize(): any {
		return {
			type: "gather",
			expr: this.expr.serialize()
		};
	}
}

export class Omit extends Gather {
	parse(input: string, ctx: Parser, cursor: Reference): SyntaxNode | ParseError {
		let res = this.expr.parse(input, ctx, cursor);
		if (res instanceof ParseError) {
			return res;
		}

		return new SyntaxNode("omit", "", res.ref);
	}

	serialize(): any {
		let out = super.serialize();
		out.type = "omit";

		return out;
	}
}





export class Not {
	expr: Expression;
	count: Count;

	constructor(json: any) {
		this.expr = ParseExpression(json['expr']);
		this.count = ParseCount(json['count']);
	}

	parse(input: string, ctx: Parser, cursor: Reference): SyntaxNode | ParseError {
		let start = cursor.clone();
		let consumption = 0;

		while (true) {
			if (consumption >= 1 && (this.count == Count.One || this.count == Count.ZeroToOne)) {
				break;
			}
			if (cursor.index >= input.length) {
				break;
			}

			let check = this.expr.parse(input, ctx, cursor.clone());
			if (check instanceof ParseError) {
				cursor.advance(input[cursor.index] == "\n");
				consumption++;
			} else {
				break;
			}
		}

		let range = new ReferenceRange(start, cursor);

		if (!CountCheck(consumption, this.count)) {
			return new ParseError(`Didn't consume the correct amount. ${consumption} ${this.count}`, range);
		}

		return new SyntaxNode("literal", input.slice(start.index, cursor.index), range);
	}

	serialize(): any {
		return {
			type: "not",
			expr: this.expr.serialize(),
			count: this.count
		};
	}
}

export class Term {
	value: string;
	count: Count

	constructor(json: any) {
		this.value = json['value'];
		this.count = ParseCount(json['count']);
	}

	parse(input: string, ctx: Parser, cursor: Reference): SyntaxNode | ParseError {
		let expr = ctx.getRule(this.value);
		let start = cursor.clone();
		let consumption = 0;

		let err: ParseError | null = null;
		let nodes: SyntaxNode[] = [];

		while (true) {
			if (consumption >= 1 && (this.count == Count.One || this.count == Count.ZeroToOne)) {
				break;
			}
			if (cursor.index >= input.length) {
				break;
			}

			let res = expr.parse(input, ctx, cursor.clone());
			if (res instanceof ParseError) {
				err = res;
				break;
			} else {
				cursor = res.ref.end;
				res.type = this.value;
				nodes.push(res);
				consumption++;
			}
		}

		let range = new ReferenceRange(start, cursor);
		if (!CountCheck(consumption, this.count)) {
			if (!err) {
				err = new ParseError(`Didn't consume the correct amount. ${consumption} ${this.count}`, range);
			}
			err.add_stack(this.value);
			return err;
		}

		if (this.count == Count.One) {
			return nodes[0];
		}

		return new SyntaxNode(this.value, nodes, range);
	}

	serialize(): any {
		return {
			type: "term",
			value: this.value,
			count: this.count
		};
	}
}





export class Select {
	exprs: Expression[];
	count: Count;

	constructor(json: any) {
		this.exprs = [];
		this.count = ParseCount(json['count']);

		for (let value of json['exprs']) {
			this.exprs.push(ParseExpression(value))
		}
	}

	parse(input: string, ctx: Parser, cursor: Reference): SyntaxNode | ParseError {
		let count = 0;
		let start = cursor.clone();

		let err: ParseError | null = null;
		let nodes: SyntaxNode[] = [];

		while (true) {
			if (count >= 1 && (this.count == Count.One || this.count == Count.ZeroToOne)) {
				break;
			}

			let res = this.parseSingle(input, ctx, cursor.clone());
			if (res instanceof ParseError) {
				err = res;
				break;
			}
			cursor = res.ref.end.clone();
			nodes.push(res);
			count++;
		}

		let range = new ReferenceRange(start, cursor);
		if (!CountCheck(count, this.count)) {
			if (!err) {
				err = new ParseError("Invalid count of sequence", range);
			}
			return err;
		}

		if (this.count == Count.One) {
			return nodes[0];
		} else {
			return new SyntaxNode(`(...)${this.count}`, nodes, range);
		}
	}

	parseSingle(input: string, ctx: Parser, cursor: Reference): SyntaxNode | ParseError {
		let span = new ReferenceRange(cursor.clone(), cursor.clone());
		let err: string = "";

		for (let opt of this.exprs) {
			let res = opt.parse(input, ctx, cursor.clone());
			if (res instanceof ParseError) {
				span.span(res.ref);
				err = res.msg;
				continue;
			} else {
				return res;
			}
		}

		return new ParseError("No valid option found", new ReferenceRange(cursor, cursor));
	}

	serialize(): any {
		return {
			type: "select",
			exprs: this.exprs.map(x => x.serialize()),
			count: this.count
		};
	}
}


export class Sequence extends Select {
	constructor(json: any) {
		super(json);
	}

	parseSingle(input: string, ctx: Parser, cursor: Reference): SyntaxNode | ParseError {
		let start = cursor.clone();
		let nodes: SyntaxNode[] = [];

		for (let rule of this.exprs) {
			let res = rule.parse(input, ctx, cursor.clone());
			if (res instanceof ParseError) {
				res.ref.span(new ReferenceRange(start, cursor));
				return res;
			}

			cursor = res.ref.end;

			if (res.type != "omit") {
				nodes.push(res);
			}
		}

		return new SyntaxNode('seq[]', nodes, new ReferenceRange(start, cursor));
	}

	serialize(): any {
		let out = super.serialize();
		out.type = "sequence";

		return out;
	}
}




export class Rule {
	name: string;
	seq: Expression;

	constructor(name: string, json: any){
		this.name = name;
		this.seq = ParseExpression(json);
	}

	parse(input: string, ctx: Parser, cursor: Reference): SyntaxNode | ParseError {
		let res = this.seq.parse(input, ctx, cursor);
		if (res instanceof SyntaxNode) {
			res.type = this.name;
		}

		return res;
	}

	serialize (): any {
		return this.seq.serialize();
	}
}

export class Parser {
	terms: Map<string, Rule>;

	constructor(json: any) {
		this.terms = new Map();
		for (let key in json) {
			this.addRule(key, new Rule(key, json[key]));
		}
	}

	getRule(name: string): Rule {
		let rule = this.terms.get(name);
		if (rule == null) {
			throw new ReferenceError(`Unknown Rule ${name}`);
		}

		return rule;
	}

	addRule(name: string, rule: Rule) {
		this.terms.set(name, rule);
	}

	parse(input: string, partial = false, entry = "program"): SyntaxNode | ParseError {
		let entryTerm = this.getRule(entry);
		let res = entryTerm.parse(input, this, new Reference(1,1,0));
		if (res instanceof ParseError) {
			return res;
		}

		if (!partial && res.ref.end.index != input.length) {
			return new ParseError(
				"Didn't consume the entire string",
				new ReferenceRange(res.ref.end, new Reference(0, 0, input.length))
			);
		}

		return res;
	}

	serialize(): any {
		let blob: any = {};

		for (let [key, rule] of this.terms) {
			blob[key] = rule.serialize();
		}

		return blob;
	}
}