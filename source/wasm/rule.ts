import { Expression, Rule, Sequence } from "../parser.js";
import LiteralMapping from "./literal-mapping.js";
import binaryen from "binaryen";


const syntaxFuncParams = binaryen.createType([binaryen.i32]);

type CompileContext = {
	m: binaryen.Module;
	literals: LiteralMapping;
	offset: number;
	vars: number[];
};

export function CompileRule(m: binaryen.Module, literals: LiteralMapping, rule: Rule) {
	const ctx = {
		m, literals,
		offset: 1,
		vars: []
	};

	const block = CompileExpression(ctx, rule.seq);
	m.addFunction( rule.name, syntaxFuncParams, binaryen.none, ctx.vars, block );
	m.addFunctionExport(rule.name, rule.name);
}


function CompileExpression(ctx: CompileContext, expr: Expression) {
	if (expr instanceof Sequence) {
		return CompileSequence(ctx, expr);
	} else {
		throw new Error(`Unexpected expression type ${expr.constructor.name} during compilation`);
	}
}

function CompileSequence(ctx: CompileContext, expr: Sequence) {
	const rewind = ctx.vars.length + ctx.offset;
	ctx.vars.push(binaryen.i32);

	console.log(40, expr);

	return ctx.m.block(null, [
		ctx.m.local.set(rewind, ctx.m.global.get("heap", binaryen.i32)),
		ctx.m.i32.store(
			0, 1,
			ctx.m.global.get("heap", binaryen.i32),
			ctx.m.i32.const(0)
		),
		ctx.m.i32.store(
			0, 4,
			ctx.m.global.get("heap", binaryen.i32),
			ctx.m.call("matchString", [
				ctx.m.local.get(0, binaryen.i32),
				ctx.m.i32.const(0),
				ctx.m.i32.const(5),
			], binaryen.i32)
		)
	]);
}