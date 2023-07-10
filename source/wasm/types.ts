import { CharRange, Count, Expression, Gather, Literal, Not, Omit, Parser, Rule, Select, Sequence, Term } from "../legacy/parser.js";



function CompileExpression(expr: Expression): string {
	switch (expr.constructor.name) {
		case "Sequence":  return CompileSequence(expr as Sequence);
		case "Select":    return CompileSelect  (expr as Select);
		case "Literal":   return CompileLiteral (expr as Literal);
		case "Term":      return CompileTerm    (expr as Term);
		case "CharRange": return CompileRange   ();
		case "Omit":      return CompileOmit    ();
		case "Not":       return CompileNot     ();
		case "Gather":    return CompileGather  ();
	}

	throw new Error(`Unexpected expression type ${expr.constructor.name} during compilation`);
}


function CompileSequence(expr: Sequence): string {
	const once = CompileSequenceOnce(expr);

	if (expr.count === "1") {
		return once;
	} else {
		return CompileRepeat(once, expr.count);
	}
}

function CompileSequenceOnce(expr: Sequence): string {
	return "SyntaxNode & {\n  type: \"(...)\", value: [\n" +
		expr.exprs
			.map(x => CompileExpression(x))
			.filter(x => x.length > 0)
			.map(x => "    " + x)
			.join(",\n") +
		"\n  ]\n}";
}


function CompileSelect(expr: Select): string {
	const once = CompileSelectOnce(expr);

	if (expr.count === "1") {
		return once;
	} else {
		return CompileRepeat(once, expr.count);
	}
}

function CompileSelectOnce(expr: Select): string {
	return "(" +
		expr.exprs
			.map(x => CompileExpression(x))
			.filter(x => x.length > 0)
			.join(" | ") +
		")";
}


function CompileOmit(): string {
	return "";
}

function CompileGather(): string {
	return "(SyntaxNode & { type: \"literal\", value: string })";
}


function CompileTerm(expr: Term): string {
	const once = CompileTermOnce(expr);

	if (expr.count === "1") {
		return once;
	} else {
		return CompileRepeat(once, expr.count);
	}
}

function CompileTermOnce(expr: Term): string {
	return "Term_" + expr.value[0].toUpperCase() + expr.value.slice(1);;
}


function CompileNot(): string {
	return "(SyntaxNode & { type: \"literal\", value: string })";
}

function CompileRange(): string {
	return "(SyntaxNode & { type: \"literal\", value: string })";
}



function CompileLiteral(expr: Literal): string {
	const once = CompileLiteralOnce(expr);

	if (expr.count === "1") {
		return once;
	} else {
		return CompileRepeat(once, expr.count);
	}
}

function CompileLiteralOnce(expr: Literal): string {
	let safe = expr.value.replace(/[^a-zA-Z0-9]/g,
		(char) => "\\x" + char.charCodeAt(0).toString(16).padStart(2, "0")
	);

	return `(SyntaxNode & { type: "literal", value: "${safe}" })`;
}





function CompileRepeat(innerType: string, repetitions: Count): string {
	if (repetitions === "1") throw new Error("Don't compile repetitions for 1 to 1 repetition");
	return `SyntaxNode & { type: "(...)${repetitions}", value: ${innerType}[] }`;
}






function CompileRule(rule: Rule) {
	// Make sure all rules start with a sequence
	// let inner = rule.seq;
	// if (inner.constructor.name === "Select") {
	// 	let child: Expression = inner as Select;
	// 	if (child.exprs.length === 1) child = child.exprs[0];

	let inner = rule.seq;
	if (inner.constructor.name === "Select") {
		let child: Expression = inner as Select;
		if (child.exprs.length === 1) child = child.exprs[0];

		inner = new Sequence({
			exprs: [],
			count: "1"
		});
		inner.exprs = [ child ];
	} else if (rule.seq.constructor.name !== "Sequence") {
		inner = new Sequence({
			exprs: [],
			count: "1"
		});
		inner.exprs = [ rule.seq ];
	}

	return `export type Term_${rule.name[0].toUpperCase()}${rule.name.slice(1)} = ${CompileExpression(inner)}`;
}


export function Compile(lang: Parser) {
	return `declare type Reference = {
	start: number;
	end  : number;
}
declare type ReferenceRange = {
	start: Reference;
	end  : Reference;
}
declare type SyntaxNode = {
	type : string;
	start: number;
	end  : number;
	count: number;
	value: SyntaxNode[] | string;
	ref: ReferenceRange | null;
}\n`+ [...lang.terms.keys()]
	.map(x => CompileRule(lang.terms.get(x) as any)) // hush Typescript it's okay
	.join("\n");
}