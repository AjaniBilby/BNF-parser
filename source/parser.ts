import { SyntaxNode, ParseError, Reference, ReferenceRange } from "./syntax";

export type Expression = Literal | CharRange | Term | Not | Omit | Gather | Select | Sequence;

function ParseExpression(json: any): Expression {
	switch (<string> json['type']) {
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


function RandInt(min: number, max: number): number {
	return Math.round( Math.random()*(max-min) + min )
}

function RandomFromCount(limit: Count, min = 1, max = 5) {
	switch (limit) {
		case Count.One:
			return 1;
		case Count.ZeroToOne:
			return Math.round(Math.random());
		case Count.OneToMany:
			min = Math.max(min, 1);
			// continue to next case
		case Count.ZeroToMany:
			return RandInt(min, max);
		default:
			throw new Error(`Unknown count type ${limit}`);
	}
}





export class Literal {
	value: string;
	count: Count;

	constructor(json: any) {
		this.value = json['value'];
		this.count = ParseCount(json['count']);
	}

	parse(input: string, cursor: Reference): SyntaxNode | ParseError {
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

	link(ctx: Parser) { }

	random(depth: number): string {
		let ittr = RandomFromCount(this.count, 1, depth*0.5 + 10);
		let out = "";
		for (let i=0; i<ittr; i++) {
			out += this.randomSingle();
		}

		return out;
	}

	randomSingle(): string {
		return this.value;
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

	randomSingle(): string {
		return String.fromCharCode(RandInt(
			this.value.charCodeAt(0),
			this.to.charCodeAt(0)
		));
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

	parse(input: string, cursor: Reference): SyntaxNode | ParseError {
		let res = this.expr.parse(input, cursor);
		if (res instanceof ParseError) {
			return res;
		}

		res.value = res.flat();
		return res;
	}

	link(ctx: Parser) {
		this.expr.link(ctx);
	}

	random(depth: number): string {
		return this.expr.random(depth);
	}

	serialize(): any {
		return {
			type: "gather",
			expr: this.expr.serialize()
		};
	}
}

export class Omit extends Gather {
	parse(input: string, cursor: Reference): SyntaxNode | ParseError {
		let res = this.expr.parse(input, cursor);
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

	parse(input: string, cursor: Reference): SyntaxNode | ParseError {
		let start = cursor.clone();
		let consumption = 0;

		while (true) {
			if (consumption >= 1 && (this.count == Count.One || this.count == Count.ZeroToOne)) {
				break;
			}
			if (cursor.index >= input.length) {
				break;
			}

			let check = this.expr.parse(input, cursor.clone());
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

	link(ctx: Parser) {
		this.expr.link(ctx);
	}

	random(depth: number): string {
		return "{{NOT}}";
	}

	serialize(): any {
		return {
			type: "not",
			count: this.count,
			expr: this.expr.serialize()
		};
	}
}

export class Term {
	expr: Rule | null
	value: string;
	count: Count

	constructor(json: any) {
		this.value = json['value'];
		this.count = ParseCount(json['count']);
		this.expr = null;
	}

	parse(input: string, cursor: Reference): SyntaxNode | ParseError {
		let start = cursor.clone();
		let consumption = 0;

		let err: ParseError | null = null;
		let nodes: SyntaxNode[] = [];

		if (!(this.expr instanceof Rule)) {
			throw new TypeError("Attempting ot parse with unlinked Term");
		}

		while (true) {
			if (consumption >= 1 && (this.count == Count.One || this.count == Count.ZeroToOne)) {
				break;
			}
			if (cursor.index >= input.length) {
				break;
			}

			let res = this.expr?.parse(input, cursor.clone());
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

		return new SyntaxNode(this.value+this.count, nodes, range);
	}

	link(ctx: Parser) {
		this.expr = ctx.getRule(this.value);
	}

	random(depth: number): string {
		return (this.expr as Rule).random(depth-1);
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

	parse(input: string, cursor: Reference): SyntaxNode | ParseError {
		let count = 0;
		let start = cursor.clone();

		let err: ParseError | null = null;
		let nodes: SyntaxNode[] = [];

		while (true) {
			if (count >= 1 && (this.count == Count.One || this.count == Count.ZeroToOne)) {
				break;
			}

			let res = this.parseSingle(input, cursor.clone());
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
		}

		return new SyntaxNode(`(...)${this.count}`, nodes, range);
	}

	parseSingle(input: string, cursor: Reference): SyntaxNode | ParseError {
		let span = new ReferenceRange(cursor.clone(), cursor.clone());
		let err: string = "";

		for (let opt of this.exprs) {
			let res = opt.parse(input, cursor.clone());
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

	link(ctx: Parser) {
		for (let expr of this.exprs) {
			expr.link(ctx);
		}
	}

	random(depth: number): string {
		let iter = RandomFromCount(
			this.count,
			0, 5
		);
		let out = "";
		for (let i=0; i<iter; i++) {
			out += this.randomSingle(depth-1);
		}

		return out;
	}

	randomSingle(depth: number): string {
		let index = RandInt(0, this.exprs.length-1);
		return this.exprs[index].random(depth-1);
	}

	serialize(): any {
		return {
			type: "select",
			count: this.count,
			exprs: this.exprs.map(x => x.serialize())
		};
	}
}


export class Sequence extends Select {
	constructor(json: any) {
		super(json);
	}

	parseSingle(input: string, cursor: Reference): SyntaxNode | ParseError {
		let start = cursor.clone();
		let nodes: SyntaxNode[] = [];

		for (let rule of this.exprs) {
			let res = rule.parse(input, cursor.clone());
			if (res instanceof ParseError) {
				res.ref.span(new ReferenceRange(start, cursor));
				return res;
			}

			cursor = res.ref.end;

			if (rule instanceof Omit) {
				continue; // skip omitted operands
			} else {
				nodes.push(res);
			}
		}

		return new SyntaxNode('seq[]', nodes, new ReferenceRange(start, cursor));
	}

	randomSingle(depth: number): string {
		let out = "";
		for (let expr of this.exprs) {
			out += expr.random(depth);
		}
		return out;
	}

	serialize(): any {
		let out = super.serialize();
		out.type = "sequence";

		return out;
	}
}




export class Rule {
	name: string;
	expr: Expression;
	verbose: boolean;

	constructor(name: string, json: any){
		this.name = name;
		this.expr = ParseExpression(json);
		this.verbose = false;
	}

	parse(input: string, cursor: Reference): SyntaxNode | ParseError {
		if (this.verbose) {
			console.log(`Parsing rule "${this.name}" at ${cursor.toString()}`);
		}

		let res = this.expr.parse(input, cursor);
		if (res instanceof SyntaxNode) {
			res.type = this.name;
		}

		return res;
	}

	link(ctx: Parser) {
		this.expr.link(ctx);
	}

	random(depth: number): string {
		if (depth <= 0) {
			return "{{CAP}}";
		}

		return this.expr.random(depth-1);
	}

	setVerbose(mode: boolean) {
		this.verbose = mode;
	}

	serialize (): any {
		return this.expr.serialize();
	}
}

export class Parser {
	terms: Map<string, Rule>;

	constructor(json: any) {
		this.terms = new Map();
		for (let key in json) {
			this.addRule(key, new Rule(key, json[key]));
		}

		this.link();
	}

	getRule(name: string): Rule {
		let rule = this.terms.get(name);
		if (rule == null) {
			throw new ReferenceError(`Unknown Rule ${name}`);
		}

		return rule;
	}

	addRule(name: string, rule: Rule) {
		if (this.terms.has(name)) {
			throw new Error(`Attempting to add rule "${name}" to a parser which already has a rule of that name`);
		}

		this.terms.set(name, rule);
	}

	parse(input: string, partial = false, entry = "program"): SyntaxNode | ParseError {
		let entryTerm = this.getRule(entry);
		let res = entryTerm.parse(input, new Reference(1,1,0));
		if (res instanceof ParseError) {
			return res;
		}

		if (!partial && res.ref.end.index != input.length) {
			return new ParseError(
				"Unexpected syntax at ",
				new ReferenceRange(res.ref.end.clone(), res.ref.end)
			);
		}

		return res;
	}

	link() {
		for (let key of this.terms.keys()) {
			this.terms.get(key)?.link(this);
		}
	}

	random(entry = "program"): string {
		let entryTerm = this.getRule(entry);
		return entryTerm.random(50);
	}

	setVerbose(mode: boolean) {
		for (let key of this.terms.keys()) {
			this.terms.get(key)?.setVerbose(mode);
		}
	}

	serialize(): any {
		let blob: any = {};

		for (let [key, rule] of this.terms) {
			blob[key] = rule.serialize();
		}

		return blob;
	}
}