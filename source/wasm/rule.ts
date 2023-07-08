import { CharRange, Count, Expression, Literal, Rule, Select, Sequence, Term } from "../parser.js";
import LiteralMapping from "./literal-mapping.js";
import binaryen from "binaryen";

import { OFFSET } from "./layout.js";


const syntaxFuncParams = binaryen.createType([]);

const SHARED = {
	ERROR: 0, // local variable for error flag
}

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
		if (!label) label = this.reserveBlock();
		this._blocks.push(label);

		return label;
	}

	reserveBlock() {
		return `_bb${(this._bID++).toString()}`;
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
	} else if (expr instanceof Select) {
		return CompileSelect(ctx, expr, name);
	} else if (expr instanceof CharRange) {
		throw new Error(`Unexpected expression type ${expr.constructor.name} during compilation`);
	} else if (expr instanceof Literal) {
		return CompileLiteral(ctx, expr);
	} else if (expr instanceof Term) {
		return CompileTerm(ctx, expr);
	}

	throw new Error(`Unexpected expression type ${expr.constructor.name} during compilation`);
}


function CompileSequence(ctx: CompilerContext, expr: Sequence, name?: string): number {
	const once = CompileSequenceOnce(ctx, expr, name);

	if (expr.count === "1") {
		return once;
	} else {
		return CompileRepeat(ctx, once, expr.count);
	}
}

function CompileSequenceOnce(ctx: CompilerContext, expr: Sequence, name?: string): number {
	// const index  = SHARED.INDEX;
	const error  = SHARED.ERROR;
	const rewind = ctx.declareVar(binaryen.i32);

	if (!name) {
		name = "(...)";
	}
	const literal = ctx.l.getKey(name);

	const lblBody    = ctx.reserveBlock();

	return ctx.m.block(null, [
		ctx.m.local.set(rewind, ctx.m.global.get("heap", binaryen.i32)),

		ctx.m.i32.store(
			OFFSET.START, 4,
			ctx.m.local.get(rewind,   binaryen.i32),
			ctx.m.global.get("index", binaryen.i32)
		),


		ctx.m.global.set("heap", ctx.m.i32.add(
			ctx.m.local.get(rewind, binaryen.i32),
			ctx.m.i32.const(OFFSET.DATA)
		)),

		ctx.m.block(lblBody, expr.exprs.flatMap((child) => [
			CompileExpression(ctx, child),

			// Stop parsing if child failed to parse
			ctx.m.br(lblBody, ctx.m.i32.eq(
				ctx.m.local.get(error, binaryen.i32),
				ctx.m.i32.const(1)
			))
		])),

		ctx.m.if(
			ctx.m.i32.eq(
				ctx.m.local.get(error, binaryen.i32),
				ctx.m.i32.const(1)
			),
			ctx.m.block(null, [
				// mark failed + rollback ALL progress
				ctx.m.local.set(error, ctx.m.i32.const(1)),
				ctx.m.global.set("index",
					ctx.m.i32.load(
						OFFSET.START, 4,
						ctx.m.local.get(rewind, binaryen.i32)
					)
				),
				ctx.m.global.set("heap", ctx.m.local.get(rewind, binaryen.i32))
			]),
			ctx.m.block(null, [
				// Success
				ctx.m.i32.store(
					OFFSET.TYPE, 4,
					ctx.m.local.get(rewind, binaryen.i32),
					ctx.m.i32.const(literal.offset)
				),
				ctx.m.i32.store(
					OFFSET.TYPE_LEN, 4,
					ctx.m.local.get(rewind, binaryen.i32),
					ctx.m.i32.const(literal.bytes.byteLength)
				),
				// End index
				ctx.m.i32.store(
					OFFSET.END, 4,
					ctx.m.local.get(rewind,   binaryen.i32),
					ctx.m.global.get("index", binaryen.i32)
				),
				// Child count
				ctx.m.i32.store(
					OFFSET.COUNT, 4,
					ctx.m.local.get(rewind, binaryen.i32),
					ctx.m.i32.const(expr.exprs.length)
				)
			])
		)
	]);
}


function CompileSelect(ctx: CompilerContext, expr: Select, name?: string): number {
	const once = CompileSelectOnce(ctx, expr, name);

	if (expr.count === "1") {
		return once;
	} else {
		return CompileRepeat(ctx, once, expr.count);
	}
}

function CompileSelectOnce(ctx: CompilerContext, expr: Select, name?: string): number {
	const error  = SHARED.ERROR;
	const rewind = name ? ctx.declareVar(binaryen.i32) : null;

	const lblBody    = ctx.reserveBlock();
	const body = [];

	if (rewind) {
		body.push(ctx.m.local.set(rewind, ctx.m.global.get("heap", binaryen.i32)))
	}

	body.push(
		ctx.m.block(lblBody, expr.exprs.flatMap((child) => [
			// On failure already cleans up after itself
			CompileExpression(ctx, child),

			// Stop parsing if child succeeded to parse
			ctx.m.br(lblBody, ctx.m.i32.eq(
				ctx.m.local.get(error, binaryen.i32),
				ctx.m.i32.const(0)
			))
		]))
	)

	// Override name if necessary
	if (rewind && name) {
		const literal = ctx.l.getKey(name);

		body.push(ctx.m.if(
			ctx.m.i32.eq(
				ctx.m.local.get(error, binaryen.i32),
				ctx.m.i32.const(0)
			),
			ctx.m.block(null, [
				ctx.m.i32.store(
					OFFSET.TYPE, 4,
					ctx.m.local.get(rewind, binaryen.i32),
					ctx.m.i32.const(literal.offset)
				),
				ctx.m.i32.store(
					OFFSET.TYPE_LEN, 4,
					ctx.m.local.get(rewind, binaryen.i32),
					ctx.m.i32.const(literal.bytes.byteLength)
				),
			])
		))
	}

	return ctx.m.block(null, body);
}


function CompileTerm(ctx: CompilerContext, expr: Term): number {
	const once = CompileTermOnce(ctx, expr);

	if (expr.count === "1") {
		return once;
	} else {
		return CompileRepeat(ctx, once, expr.count);
	}
}

function CompileTermOnce(ctx: CompilerContext, expr: Term): number {
	// const index  = SHARED.INDEX;
	const error  = SHARED.ERROR;
	const rewind = ctx.declareVar(binaryen.i32);

	const literal = ctx.l.getKey(expr.value);

	return ctx.m.block(null, [
		ctx.m.local.set(rewind, ctx.m.global.get("heap", binaryen.i32)),

		ctx.m.local.set(error,
			ctx.m.call(expr.value, [], binaryen.i32)
		),

		ctx.m.if(
			ctx.m.i32.eq(
				ctx.m.local.get(error, binaryen.i32),
				ctx.m.i32.const(0)
			),
			ctx.m.block(null, [ // On success
				// Override name
				ctx.m.i32.store(
					OFFSET.TYPE, 4,
					ctx.m.local.get(rewind, binaryen.i32),
					ctx.m.i32.const(literal.offset)
				),
				ctx.m.i32.store(
					OFFSET.TYPE_LEN, 4,
					ctx.m.local.get(rewind, binaryen.i32),
					ctx.m.i32.const(literal.bytes.byteLength)
				),
			]),
			// Failure already cleaned up by child
		)
	]);
}



function CompileLiteral(ctx: CompilerContext, expr: Literal): number {
	const once = CompileLiteralOnce(ctx, expr);

	if (expr.count === "1") {
		return once;
	} else {
		return CompileRepeat(ctx, once, expr.count);
	}
}

function CompileLiteralOnce(ctx: CompilerContext, expr: Literal): number {
	// const index    = SHARED.INDEX;
	const error    = SHARED.ERROR;
	const rewind   = ctx.declareVar(binaryen.i32);
	const progress = ctx.declareVar(binaryen.i32);

	const literal = ctx.l.getKey(expr.value);
	const type    = ctx.l.getKey("literal");

	const block = ctx.pushBlock();

	return ctx.m.block(block, [
		// Store information for failure reversion
		ctx.m.local.set(rewind,
			ctx.m.global.get("heap", binaryen.i32)
		),

		// Start index
		ctx.m.i32.store(
			OFFSET.START, 4,
			ctx.m.local.get(rewind,   binaryen.i32),
			ctx.m.global.get("index", binaryen.i32)
		),

		// Attempt match
		ctx.m.local.set(progress,
			ctx.m.call("_matchString", [
				ctx.m.global.get("index", binaryen.i32),
				ctx.m.i32.const(literal.offset),
				ctx.m.i32.const(literal.bytes.byteLength),
			], binaryen.i32)
		),
		ctx.m.global.set("index",
			ctx.m.i32.add(
				ctx.m.local.get(progress, binaryen.i32),
				ctx.m.global.get("index", binaryen.i32)
			)
		),

		// Update furthest reach
		ctx.m.call("_reach_update", [
			ctx.m.global.get("index", binaryen.i32),
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
				ctx.m.global.set("index",
					ctx.m.i32.load(
						OFFSET.START, 4,
						ctx.m.local.get(rewind, binaryen.i32)
					)
				),
				ctx.m.global.set("heap", ctx.m.local.get(rewind, binaryen.i32)),
				ctx.m.br(ctx.popBlock())
			])
		),


		// Node META
		ctx.m.i32.store(
			OFFSET.TYPE, 4,
			ctx.m.global.get("heap", binaryen.i32),
			ctx.m.i32.const(type.offset)
		),
		ctx.m.i32.store(
			OFFSET.TYPE_LEN, 4,
			ctx.m.global.get("heap", binaryen.i32),
			ctx.m.i32.const(type.bytes.byteLength)
		),
		ctx.m.i32.store(
			OFFSET.END, 4,
			ctx.m.global.get("heap",  binaryen.i32),
			ctx.m.global.get("index", binaryen.i32)
		),
		ctx.m.i32.store(
			OFFSET.COUNT, 4,
			ctx.m.global.get("heap", binaryen.i32),
			ctx.m.i32.const(literal.bytes.byteLength)
		),

		// Update new heap tail
		ctx.m.global.set("heap",
			ctx.m.call("_roundWord", [
				ctx.m.i32.add(
					ctx.m.local.get(rewind, binaryen.i32),
					ctx.m.i32.const( OFFSET.DATA + literal.bytes.byteLength )
				)
			], binaryen.i32)
		),

		ctx.m.call("_memcpy", [
			ctx.m.i32.add(
				ctx.m.local.get(rewind, binaryen.i32),
				ctx.m.i32.const(OFFSET.DATA)
			),
			ctx.m.i32.const(literal.offset),
			ctx.m.i32.const(literal.bytes.byteLength),
		], binaryen.none)
	]);
}





function CompileRepeat(ctx: CompilerContext, innerWasm: number, repetitions: Count): number {
	if (repetitions === "1") throw new Error("Don't compile repetitions for 1 to 1 repetition");

	// const index = 0;
	const error = SHARED.ERROR;
	const rewind = ctx.declareVar(binaryen.i32);
	const count  = ctx.declareVar(binaryen.i32);

	let name = "(...)" + repetitions;
	const literal = ctx.l.getKey(name);

	const outer = ctx.reserveBlock();
	const block = ctx.reserveBlock();
	const loop  = ctx.reserveBlock();

	return ctx.m.block(outer, [
		// Store information for failure reversion
		ctx.m.local.set(rewind, ctx.m.global.get("heap", binaryen.i32)),
		ctx.m.local.set(count, ctx.m.i32.const(0)),

		// Start index
		ctx.m.i32.store(
			OFFSET.START, 4,
			ctx.m.local.get(rewind,   binaryen.i32),
			ctx.m.global.get("index", binaryen.i32)
		),

		ctx.m.global.set("heap", ctx.m.i32.add(
			ctx.m.local.get(rewind, binaryen.i32),
			ctx.m.i32.const(OFFSET.DATA)
		)),

		ctx.m.block(block, [
			ctx.m.loop(loop, ctx.m.block(null, [
				innerWasm,

				// Break loop if match failed
				ctx.m.br(block,
					ctx.m.i32.eq(ctx.m.local.get(error, binaryen.i32), ctx.m.i32.const(1))
				),

				// Increment count
				ctx.m.local.set(count, ctx.m.i32.add(
					ctx.m.local.get(count, binaryen.i32),
					ctx.m.i32.const(1)
				)),

				// Break loop if hit count limit
				repetitions == "?" ?
					ctx.m.br(block,
						ctx.m.i32.eq(ctx.m.local.get(count, binaryen.i32), ctx.m.i32.const(1))
					) :
					ctx.m.nop(),

				// Continue loop
				ctx.m.br(loop)
			]))
		]),

		// Check satisfies count
		/*
			At this point given repetition:
				1: Assertion error
				?: Exited the loop once 1 has reached or 0 (both fine)
				+: Exited the loop may have less than 1
				*: Doesn't care
		*/
		repetitions == "+" ?
			ctx.m.if(
				ctx.m.i32.lt_s(
					ctx.m.local.get(count, binaryen.i32),
					ctx.m.i32.const(1)
				),
				ctx.m.block(null, [
					// mark failed + rollback ALL progress
					ctx.m.local.set(error, ctx.m.i32.const(1)),
					ctx.m.global.set("index",
						ctx.m.i32.load(4, 4,
							ctx.m.local.get(rewind, binaryen.i32)
						)
					),
					ctx.m.global.set("heap", ctx.m.local.get(rewind, binaryen.i32)),
					ctx.m.br(outer)
				])
			):
			ctx.m.nop(),

		// Last iteration might have failed
		//   However we can accept the previous iterations
		//   And the fail iteration should have rolled itself back already
		ctx.m.local.set(error, ctx.m.i32.const(0)),

		// Node Meta
		ctx.m.i32.store(
			OFFSET.TYPE, 4,
			ctx.m.local.get(rewind, binaryen.i32),
			ctx.m.i32.const(literal.offset)
		),
		ctx.m.i32.store(
			OFFSET.TYPE_LEN, 4,
			ctx.m.local.get(rewind, binaryen.i32),
			ctx.m.i32.const(literal.bytes.byteLength)
		),
		ctx.m.i32.store(
			OFFSET.END, 4,
			ctx.m.local.get(rewind,   binaryen.i32),
			ctx.m.global.get("index", binaryen.i32)
		),
		// Count index
		ctx.m.i32.store(
			OFFSET.COUNT, 4,
			ctx.m.local.get(rewind, binaryen.i32),
			ctx.m.local.get(count,  binaryen.i32)
		),
	]);
}






export function CompileRule(m: binaryen.Module, literals: LiteralMapping, rule: Rule) {
	const ctx = new CompilerContext(m, literals, rule);
	// Function input
	const error = ctx.declareVar(binaryen.i32);

	const innerWasm = CompileExpression(ctx, rule.seq, rule.name);

	ctx.m.addFunction(
		rule.name,
		syntaxFuncParams, binaryen.i32,
		ctx.vars,
		ctx.m.block(null, [
			ctx.m.local.set(error, ctx.m.i32.const(0)),

			innerWasm,

			ctx.m.return(ctx.m.local.get(error, binaryen.i32))
		])
	);
	ctx.m.addFunctionExport(rule.name, rule.name);
}