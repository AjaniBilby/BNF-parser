import * as Shared from "../dist/shared.js"; // things shared between multiple pre-compiled BNFs
import * as bnf from "../dist/bnf.js";       // pre-compiled JS with WASM embedded

import * as legacy from "./legacy/parser.js";

import { ParseError, ReferenceRange, Reference } from "./artifacts/shared.js";


type ExpressionJSON = {
	type: string;
	count: legacy.Count;
	expr?: ExpressionJSON;
	exprs?: ExpressionJSON[];
	value?: string;
};


function assertUnreachable(x: never): never {
	throw new Error("Unreachable code path reachable");
}


function FlattenConstant(syntax: bnf.Term_Constant) {
	let str = "";

	for (let frag of syntax.value[0].value) {
		const inner = frag.value[0];
		switch (inner.type) {
			case "literal": str += inner.value; break;
			case "byte":    str += String.fromCharCode(parseInt(inner.value[0].value, 16)); break;
			case "escape":
				switch(inner.value[0].value) {
					case "b": str += "\b"; break;
					case "f": str += "\f"; break;
					case "n": str += "\n"; break;
					case "r": str += "\r"; break;
					case "t": str += "\t"; break;
					case "v": str += "\v"; break;
					default: str += inner.value[0].value;
				}
				break;
			default: assertUnreachable(inner);
		}
	}

	return str;
}


function BuildOperand(syntax: bnf.Term_Expr_arg, namespace: string[]) {
	const prefixes  = syntax.value[0];
	const component = syntax.value[1];

	let base: ExpressionJSON = {
		type: "constant",
		value: "",
		count: legacy.ParseCount(syntax.value[2].value || "1")
	};

	switch (component.type) {
		case "literal":
			base.value = component.value;
			base.type  = "term";
			break;
		case "constant":
			component;
			base.value = FlattenConstant(component);
			base.type  = "literal";
			break;
		case "expr_brackets":
			let res = BuildExpr(component.value[0], namespace);
			res.count = base.count;
			base = res;
			break;
		default: assertUnreachable(component);
	}

	if (prefixes.value[2].value === "!") {
		base = {
			type: "not",
			expr: base,
			count: base.count
		};
		if (!base.expr) throw new Error("Typescript please shhhh");
		base.expr.count = "1" as legacy.Count;
	}
	if (prefixes.value[1].value === "...") {
		base = {
			type: "gather",
			expr: base,
			count: "1" as legacy.Count
		};
	}
	if (prefixes.value[0].value === "%") {
		base = {
			type: "omit",
			expr: base,
			count: "1" as legacy.Count
		};
	}

	return base;
}


function BuildExpr(syntax: bnf.Term_Expr, namespace: string[]) {
	let base: ExpressionJSON = {
		type: "sequence",
		count: "1" as legacy.Count,
		exprs: [BuildOperand(syntax.value[0], namespace)]
	};

	for (const pair of syntax.value[1].value) {
		const operand = BuildOperand(pair.value[1], namespace);

		const infix = pair.value[0].value;
		switch (infix) {
			case "": // fall through
			case "|":
				const desire = infix == "|" ? "select" : "sequence";
				if (desire != base.type) {
					base = {
						type: desire,
						count: "1" as legacy.Count,
						exprs: [
							base.type === "sequence" && base.exprs?.length === 1 ? base.exprs[0] : base,
							operand
						]
					}
				} else {
					base.exprs?.push(operand);
				}
				break;
			case "->":
				const a = base.exprs?.pop();
				if (a?.type != "literal" || operand.type != "literal") {
					throw new ParseError("Attempting to make a range between two non literals", pair.value[0].ref || ReferenceRange.blank());
				}
				if (a?.type != "literal" || operand.type != "literal") {
					throw new ParseError("Attempting to make a range non single characters", pair.value[0].ref || ReferenceRange.blank());
				}

				if (a?.count != "1") {
					throw new ParseError("Unexpected count on left-hand-side of range", pair.value[0].ref || ReferenceRange.blank());
				}

				let action = {
					type: "range",
					value: a.value,
					to: operand.value,
					count: operand.count
				};
				base.exprs?.push(action);

				break;
			default: throw new ParseError(`Unknown operator "${infix}"`, pair.value[0].ref || ReferenceRange.blank());
		}
	}

	return base;
}


function CompileDefinition(syntax: bnf.Term_Def, namespace: string[]) {
	const name = syntax.value[0].value;
	const expr = BuildExpr(syntax.value[1], namespace);

	return new legacy.Rule(name, expr);
}


export function CompileProgram(syntax: bnf.Term_Program): legacy.Parser {
	const ctx = new legacy.Parser({});
	const defs = syntax.value[0];
	const namespace = defs.value.map(def => def.value[0].value);

	for (const def of defs.value) {
		const rule = CompileDefinition(def, namespace);
		ctx.addRule(rule.name, rule);

		// break;
	}

	return ctx;
}
