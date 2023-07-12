import { CharRange, Count, Expression, Gather, Literal, Not, Omit, Parser, Rule, Select, Sequence, Term } from "./legacy/parser.js";



function CompileExpression(expr: Expression, name?: string): string {
	switch (expr.constructor.name) {
		case "Sequence":  return CompileSequence(expr as Sequence, name);
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


function CompileSequence(expr: Sequence, name?: string): string {
	const once = CompileSequenceOnce(expr, name);

	if (expr.count === "1") {
		return once;
	} else {
		return CompileRepeat(once, expr.count);
	}
}

function CompileSequenceOnce(expr: Sequence, name?: string): string {
	return `{\n  type: "${name || "(...)"}", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,\n  value: [\n` +
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
	return TemplateNode(`"literal"`, "string");
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
	return TemplateNode(`"literal"`, "string");
}

function CompileRange(): string {
	return TemplateNode(`"literal"`, "string");
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

	return TemplateNode(`"literal"`, `"${safe}"`);
}





function CompileRepeat(innerType: string, repetitions: Count): string {
	if (repetitions === "1") throw new Error("Don't compile repetitions for 1 to 1 repetition");

	if (repetitions === "?") return TemplateNode(`"(...)"`, `[] | [${innerType}]`);

	return TemplateNode(`"(...)"`, innerType+"[]");
}


function TemplateNode(type: string, value: string) {
	return `{ type: ${type}, value: ${value}, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }`
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

	const typeName = `Term_${rule.name[0].toUpperCase()}${rule.name.slice(1)}`;
	return `export type ${typeName} = ${CompileExpression(inner, rule.name)}\n` +
		`export declare function ${rule.name} (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & ${typeName}, reachBytes: number, isPartial: boolean }\n`;
}


export function CompileTypes(lang: Parser) {
	return `import * as _Shared from "./shared.js";\n`+ [...lang.terms.keys()]
	.map(x => CompileRule(lang.terms.get(x) as any)) // hush Typescript it's okay
	.join("\n");
}