import { CharRange, Expression, Literal, Rule, Sequence } from "../parser.js";
import LiteralMapping from "./literal-mapping.js";
import binaryen from "binaryen";


const syntaxFuncParams = binaryen.createType([binaryen.i32]);

// Using OO because of better V8 memory optimisations
class CompilerContext {
	readonly m: binaryen.Module;
	readonly l: LiteralMapping;
	vars: number[];

	_blocks: string[];
	_bID: number

	constructor(m: binaryen.Module, literals: LiteralMapping, rule: Rule) {
		this.m = m;
		this.l = literals;
		this.vars = [];
		this._blocks = [];
		this._bID = 1;
	}


	pushBlock(label?: string) {
		if (!label) label = `_bb${(this._bID++).toString()}`;
		this._blocks.push(label);

		return label;
	}

	popBlock() {
		const out = this._blocks.pop();
		if (!out) throw new Error("Attempting to pop block when no blocks remain in context");
		return out;
	}


	declareVar(type: number) {
		const index = this.vars.length;
		this.vars.push(type);

		return index;
	}
}


function CompileExpression(ctx: CompilerContext, expr: Expression, name?: string): number {
	if (expr instanceof Sequence) {
		return CompileSequence(ctx, expr, name);
	} else if (expr instanceof CharRange) {
		throw new Error(`Unexpected expression type ${expr.constructor.name} during compilation`);
	} else if (expr instanceof Literal) {
		return CompileLiteral(ctx, expr);
	}

	throw new Error(`Unexpected expression type ${expr.constructor.name} during compilation`);
}


function CompileSequence(ctx: CompilerContext, expr: Sequence, name?: string): number {
	const index    = 0;
	const error    = 1;
	const rewind   = ctx.declareVar(binaryen.i32);
	const count    = ctx.declareVar(binaryen.i32);

	if (!name) {
		name = "(...)" + (expr.count == "1" ? "" : expr.count);
	}

	console.log(52, expr);
	const block = ctx.pushBlock();

	let instr = [
		ctx.m.local.set(rewind, ctx.m.global.get("heap", binaryen.i32)),
		ctx.m.local.set(count, ctx.m.i32.const(0)),
		// Type
		ctx.m.i32.store(
			0, 4,
			ctx.m.local.get(rewind, binaryen.i32),
			ctx.m.i32.const(ctx.l.getKey(name).offset)
		),
		// Index start
		ctx.m.i32.store(
			0, 4,
			ctx.m.i32.add(
				ctx.m.local.get(rewind, binaryen.i32),
				ctx.m.i32.const(4)
			),
			ctx.m.local.get(index, binaryen.i32)
		),
		// Index end written later
		// Child count
		ctx.m.i32.store(
			0, 4,
			ctx.m.i32.add(
				ctx.m.local.get(rewind, binaryen.i32),
				ctx.m.i32.const(4*3)
			),
			ctx.m.i32.const(0)
		),
		ctx.m.global.set("heap", ctx.m.i32.add(
			ctx.m.local.get(rewind, binaryen.i32),
			ctx.m.i32.const(4*4)
		))
	];


	for (let child of expr.exprs) {
		instr.push( CompileExpression(ctx, child) );
	}

	// instr.push(ctx.m.br(ctx.popBlock(), ctx.m.local.get(error, binaryen.i32)));

	return ctx.m.block(block, instr);
}


function CompileLiteral(ctx: CompilerContext, expr: Literal): number {
	const index    = 0;
	const error    = 1;
	const root   = ctx.declareVar(binaryen.i32);
	const progress = ctx.declareVar(binaryen.i32);

	const literal = ctx.l.getKey(expr.value);

	const block = ctx.pushBlock();

	console.log(128, expr);

	return ctx.m.block(block, [
		// Store information for failure reversion
		ctx.m.local.set(root,
			ctx.m.global.get("heap", binaryen.i32)
		),

		// Start index
		ctx.m.i32.store(
			4, 4,
			ctx.m.local.get(root,  binaryen.i32),
			ctx.m.local.get(index, binaryen.i32)
		),

		// Attempt match
		ctx.m.local.set(progress,
			ctx.m.call("_matchString", [
				ctx.m.local.get(index, binaryen.i32),
				ctx.m.i32.const(literal.offset),
				ctx.m.i32.const(literal.bytes.byteLength),
			], binaryen.i32)
		),
		ctx.m.local.set(index,
			ctx.m.i32.add(
				ctx.m.local.get(progress, binaryen.i32),
				ctx.m.local.get(index,    binaryen.i32)
			)
		),

		// Update furthest reach
		ctx.m.global.set("reach",
			ctx.m.call("_max_i32", [
				ctx.m.local.get(index,    binaryen.i32),
				ctx.m.global.get("reach", binaryen.i32),
			], binaryen.i32)
		),
		ctx.m.call("print_i32", [
			ctx.m.local.get(progress, binaryen.i32)
		], binaryen.none),

		// Check if fully matched literal
		ctx.m.if(
			ctx.m.i32.ne(
				ctx.m.local.get(progress, binaryen.i32),
				ctx.m.i32.const(literal.bytes.byteLength)
			),
			ctx.m.block(null, [
				ctx.m.local.set(error, ctx.m.i32.const(1)),
				// roll back progress
				ctx.m.local.set(index,
					ctx.m.i32.load(4, 4,
						ctx.m.local.get(root, binaryen.i32)
					)
				),
				ctx.m.global.set("heap", ctx.m.local.get(root, binaryen.i32)),
				ctx.m.br(ctx.popBlock())
			])
		),


		// Type
		ctx.m.i32.store(
			0, 4,
			ctx.m.global.get("heap", binaryen.i32),
			ctx.m.i32.const(ctx.l.getKey("literal").offset)
		),

		// Index end
		ctx.m.i32.store(
			8, 4,
			ctx.m.global.get("heap", binaryen.i32),
			ctx.m.local.get(index, binaryen.i32)
		),

		// string length
		ctx.m.i32.store(
			12, 4,
			ctx.m.global.get("heap", binaryen.i32),
			ctx.m.i32.const(literal.bytes.byteLength)
		),
		ctx.m.local.set(index, ctx.m.i32.add(
			ctx.m.local.get(index, binaryen.i32),
			ctx.m.i32.const(literal.bytes.byteLength),
		))
	]);
}






export function CompileRule(m: binaryen.Module, literals: LiteralMapping, rule: Rule) {
	const ctx = new CompilerContext(m, literals, rule);
	// Function input
	ctx.declareVar(binaryen.i32);
	const error = ctx.declareVar(binaryen.i32);

	const block = CompileExpression(ctx, rule.seq);

	ctx.m.addFunction(
		rule.name,
		syntaxFuncParams, binaryen.i32,
		ctx.vars.slice(1),
		ctx.m.block(null, [
			ctx.m.local.set(error, ctx.m.i32.const(0)),
			block,
			ctx.m.return(ctx.m.i32.const(1))
		])
	);
	ctx.m.addFunctionExport(rule.name, rule.name);
}