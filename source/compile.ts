import * as Shared from "../dist/shared.js"; // things shared between multiple pre-compiled BNFs
import * as bnf from "../dist/bnf.js";       // pre-compiled JS with WASM embedded

import * as legacy from "./legacy/parser.js";

import { readFileSync, writeFileSync } from "fs";


type ExprUnit = {
	type: string;
	count: legacy.Count;
	expr?: ExprUnit;
	exprs?: ExprUnit[];
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

	let base: ExprUnit = {
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
	let base: ExprUnit = {
		type: "sequence",
		count: "1" as legacy.Count,
		exprs: [BuildOperand(syntax.value[0], namespace)]
	};

	return base;
}


function CompileDefinition(syntax: bnf.Term_Def, namespace: string[]) {
	const expr = BuildExpr(syntax.value[1], namespace);
}


function Compile(syntax: bnf.Term_Program): legacy.Parser {
	const ctx = new legacy.Parser({});
	const defs = syntax.value[0];
	const namespace = defs.value.map(def => def.value[0].value);

	for (const def of defs.value) {
		CompileDefinition(def, namespace);

		break;
	}

	return ctx;
}



const data = readFileSync("./bnf.bnf", "utf8");

// console.log(bnf.program);
const syntax = bnf.program(data);
if (syntax instanceof Shared.ParseError) {
	console.error(syntax.toString());
	process.exit(1);
}

writeFileSync("./dump.json", JSON.stringify(syntax, null, 2));

Compile(syntax.root);
