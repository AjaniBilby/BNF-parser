import binaryen from "binaryen";

import LiteralMapping from "~/wasm/literal-mapping.js";
import {
	Rule,
	Expression,
	Select, Sequence,
	Gather,
	Not, Omit, Term, Literal,
	CharRange,
	Count
} from "~/legacy/parser.js";
import { CompilerContext } from "~/wasm/context.js";
import { OFFSET } from "~/wasm/layout.js";

const SHARED = {
	ERROR: 0, // local variable for error flag
}


function CompileExpression(ctx: CompilerContext, expr: Expression, name?: string): number {
	switch (expr.constructor.name) {
		case "Sequence":  return CompileSequence(ctx, expr as Sequence, name);
		case "Select":    return CompileSelect  (ctx, expr as Select);
		case "Literal":   return CompileLiteral (ctx, expr as Literal);
		case "CharRange": return CompileRange   (ctx, expr as CharRange);
		case "Omit":      return CompileOmit    (ctx, expr as Omit);
		case "Term":      return CompileTerm    (ctx, expr as Term);
		case "Not":       return CompileNot     (ctx, expr as Not);
		case "Gather":    return CompileGather  (ctx, expr as Gather);
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

	const visibleChildren = expr.exprs.reduce((s, c) => {
		if (c instanceof Omit) return s;
		return s + 1;
	}, 0);

	const lblBody = ctx.reserveBlock();

	const out = ctx.m.block(null, [
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
					ctx.m.i32.const(visibleChildren)
				)
			])
		)
	]);

	if (expr.ref) ctx.bindDebug(out, expr.ref);
	return out;
}


function CompileSelect(ctx: CompilerContext, expr: Select): number {
	const once = CompileSelectOnce(ctx, expr);

	if (expr.count === "1") {
		return once;
	} else {
		return CompileRepeat(ctx, once, expr.count);
	}
}

function CompileSelectOnce(ctx: CompilerContext, expr: Select): number {
	const error = SHARED.ERROR;

	const lblBody = ctx.reserveBlock();
	const body    = [];

	body.push(
		ctx.m.block(lblBody, expr.exprs.flatMap((child) => [
			// Reset error state for previous failures
			ctx.m.local.set(error, ctx.m.i32.const(0)),

			// On failure already cleans up after itself
			CompileExpression(ctx, child),

			// Stop parsing if child succeeded to parse
			ctx.m.br(lblBody, ctx.m.i32.eq(
				ctx.m.local.get(error, binaryen.i32),
				ctx.m.i32.const(0)
			))
		]))
	)

	const out = ctx.m.block(null, body);

	if (expr.ref) ctx.bindDebug(out, expr.ref);
	return out;
}


function CompileOmit(ctx: CompilerContext, expr: Omit): number {
	const rewind = ctx.declareVar(binaryen.i32);

	const out = ctx.m.block(null, [
		ctx.m.local.set(rewind, ctx.m.global.get("heap", binaryen.i32)),
		CompileExpression(ctx, expr.expr),
		ctx.m.global.set("heap", ctx.m.local.get(rewind, binaryen.i32)),
	]);

	if (expr.ref) ctx.bindDebug(out, expr.ref);
	return out;
}

function CompileGather(ctx: CompilerContext, expr: Omit): number {
	const error  = SHARED.ERROR;
	const rewind = ctx.declareVar(binaryen.i32);

	const literal = ctx.l.getKey("literal");

	const out = ctx.m.block(null, [
		ctx.m.local.set(rewind, ctx.m.global.get("heap", binaryen.i32)),

		// All meta set after the fact

		CompileExpression(ctx, expr.expr),

		ctx.m.if(
			ctx.m.i32.eq(
				ctx.m.local.get(error, binaryen.i32),
				ctx.m.i32.const(1)
			),
			ctx.m.block(null, [
				// Unwind error
				ctx.m.global.set("heap", ctx.m.local.get(rewind, binaryen.i32)),
			]),
			ctx.m.block(null, [
				ctx.m.i32.store(
					OFFSET.COUNT, 4,
					ctx.m.local.get(rewind, binaryen.i32),
					ctx.m.call("_gather", [
						ctx.m.local.get(rewind, binaryen.i32),
						ctx.m.i32.add(
							ctx.m.local.get(rewind, binaryen.i32),
							ctx.m.i32.const(OFFSET.DATA)
						)
					], binaryen.i32)
				),

				// Override type
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

				// Heap position
				ctx.m.global.set("heap", ctx.m.call("_roundWord", [
					ctx.m.i32.add(
						ctx.m.local.get(rewind, binaryen.i32),
						ctx.m.i32.add(
							ctx.m.i32.load(
								OFFSET.COUNT, 4,
								ctx.m.local.get(rewind, binaryen.i32)
							),
							ctx.m.i32.const(OFFSET.DATA)
						)
					)
				], binaryen.i32))
			]),
		)
	]);

	if (expr.ref) ctx.bindDebug(out, expr.ref);
	return out;
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

	const out = ctx.m.block(null, [
		ctx.m.local.set(rewind, ctx.m.global.get("heap", binaryen.i32)),

		// Forward processing to child
		ctx.m.local.set(error,
			ctx.m.call(expr.value, [], binaryen.i32)
		)
	]);

	if (expr.ref) ctx.bindDebug(out, expr.ref);
	return out;
}


function CompileNot(ctx: CompilerContext, expr: Not): number {
	const error = SHARED.ERROR;
	const rewind = ctx.declareVar(binaryen.i32);
	const count  = ctx.declareVar(binaryen.i32);

	const literal = ctx.l.getKey("literal");

	const outer = ctx.reserveBlock();
	const block = ctx.reserveBlock();
	const loop  = ctx.reserveBlock();

	const out = ctx.m.block(outer, [
		// Store information for failure reversion
		ctx.m.local.set(rewind, ctx.m.global.get("heap", binaryen.i32)),
		ctx.m.local.set(count,  ctx.m.i32.const(0)),

		// Start index
		ctx.m.i32.store(
			OFFSET.START, 4,
			ctx.m.local.get(rewind,   binaryen.i32),
			ctx.m.global.get("index", binaryen.i32)
		),

		// Backup reach
		ctx.m.i32.store(
			OFFSET.END, 4,
			ctx.m.local.get(rewind,   binaryen.i32),
			ctx.m.global.get("reach", binaryen.i32)
		),

		ctx.m.global.set("heap", ctx.m.i32.add(
			ctx.m.local.get(rewind, binaryen.i32),
			ctx.m.i32.const(OFFSET.DATA)
		)),

		ctx.m.block(block, [
			ctx.m.loop(loop, ctx.m.block(null, [
				ctx.m.br(block, ctx.m.i32.ge_s(
					ctx.m.global.get("index",       binaryen.i32),
					ctx.m.global.get("inputLength", binaryen.i32)
				)),

				ctx.m.local.set(error, ctx.m.i32.const(0)), // don't confuse the child call with previous fails
				CompileExpression(ctx, expr.expr),

				// Break loop if match succeeded
				ctx.m.br(block,
					ctx.m.i32.eq(ctx.m.local.get(error, binaryen.i32), ctx.m.i32.const(0))
				),

				// Increment count
				ctx.m.local.set(count, ctx.m.i32.add(
					ctx.m.local.get(count, binaryen.i32),
					ctx.m.i32.const(1)
				)),

				ctx.m.global.set("index", ctx.m.i32.add(
					ctx.m.global.get("index", binaryen.i32),
					ctx.m.i32.const(1)
				)),

				// Hit limit count, break loop
				expr.count == "?" || expr.count == "1" ?
					ctx.m.br(block) :
					ctx.m.nop(),

				// Continue loop
				ctx.m.br(loop)
			]))
		]),

		// Fix reach which might have been corrupted by NOT's child
		ctx.m.global.set("reach",
			ctx.m.i32.load(
				OFFSET.END, 4,
				ctx.m.local.get(rewind, binaryen.i32)
			)
		),
		// Update to true reach
		ctx.m.call("_reach_update", [
			ctx.m.i32.add(
				ctx.m.i32.load(
					OFFSET.START, 4,
					ctx.m.local.get(rewind, binaryen.i32)
				),
				ctx.m.local.get(count, binaryen.i32)
			)
		], binaryen.none),

		// Check satisfies count
		/*
			At this point given repetition:
				?, 1: Exited the loop once 1 had been reached, 0 -> 1
				*, +: Exited when failed so 0 -> many
		*/
		expr.count == "+" || expr.count == "1" ?
			ctx.m.if(
				ctx.m.i32.lt_s(
					ctx.m.local.get(count, binaryen.i32),
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
					ctx.m.global.set("heap", ctx.m.local.get(rewind, binaryen.i32)),
					ctx.m.br(outer)
				])
			):
			ctx.m.nop(),

		// UNO REVERSE! This is a NOT statement
		ctx.m.local.set(error, ctx.m.i32.const(0)),

		// The exit case of the loop means the NOT's child was successful
		// 	This child likely pushed index forwards, correct the index position
		ctx.m.global.set("index",
			ctx.m.i32.add(
				ctx.m.i32.load(
					OFFSET.START, 4,
					ctx.m.local.get(rewind, binaryen.i32)
				),
				ctx.m.local.get(count, binaryen.i32)
			)
		),

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

		// Copy in the data
		ctx.m.call("_memcpy", [
			ctx.m.i32.add(
				ctx.m.local.get(rewind, binaryen.i32),
				ctx.m.i32.const(OFFSET.DATA)
			),
			ctx.m.i32.add(
				ctx.m.global.get("input", binaryen.i32),
				ctx.m.i32.load(
					OFFSET.START, 4,
					ctx.m.local.get(rewind, binaryen.i32)
				),
			),
			ctx.m.local.get(count, binaryen.i32),
		], binaryen.none),

		// Update new heap tail
		ctx.m.global.set("heap",
			ctx.m.call("_roundWord", [
				ctx.m.i32.add(
					ctx.m.local.get(rewind, binaryen.i32),
					ctx.m.i32.add(
						ctx.m.local.get(count, binaryen.i32),
						ctx.m.i32.const( OFFSET.DATA )
					)
				)
			], binaryen.i32)
		),
	]);

	if (expr.ref) ctx.bindDebug(out, expr.ref);
	return out;
}

function CompileRange(ctx: CompilerContext, expr: CharRange): number {
	const error = SHARED.ERROR;
	const rewind = ctx.declareVar(binaryen.i32);
	const count  = ctx.declareVar(binaryen.i32);

	const literal = ctx.l.getKey("literal");

	const outer = ctx.reserveBlock();
	const block = ctx.reserveBlock();
	const loop  = ctx.reserveBlock();

	const out = ctx.m.block(outer, [
		// Store information for failure reversion
		ctx.m.local.set(rewind,  ctx.m.global.get("heap", binaryen.i32)),
		ctx.m.local.set(count, ctx.m.i32.const(0)),

		// Start index
		ctx.m.i32.store(
			OFFSET.START, 4,
			ctx.m.local.get(rewind,   binaryen.i32),
			ctx.m.global.get("index", binaryen.i32)
		),


		ctx.m.block(block, [
			ctx.m.loop(loop, ctx.m.block(null, [
				ctx.m.br(block, ctx.m.i32.ge_s(
					ctx.m.global.get("index",       binaryen.i32),
					ctx.m.global.get("inputLength", binaryen.i32)
				)),

				// Break loop if char not in range
				ctx.m.br(block,
					ctx.m.i32.or(
						ctx.m.i32.gt_s(
							ctx.m.i32.load8_u(0, 1,
								ctx.m.i32.add(
									ctx.m.global.get("index", binaryen.i32),
									ctx.m.global.get("input", binaryen.i32)
								)
							),
							ctx.m.i32.const( expr.to.charCodeAt(0) )
						),
						ctx.m.i32.lt_s(
							ctx.m.i32.load8_u(0, 1,
								ctx.m.i32.add(
									ctx.m.global.get("index", binaryen.i32),
									ctx.m.global.get("input", binaryen.i32)
								)
							),
							ctx.m.i32.const( expr.value.charCodeAt(0) )
						)
					)
				),

				// Increment count
				ctx.m.local.set(count, ctx.m.i32.add(
					ctx.m.local.get(count, binaryen.i32),
					ctx.m.i32.const(1)
				)),

				ctx.m.global.set("index", ctx.m.i32.add(
					ctx.m.global.get("index", binaryen.i32),
					ctx.m.i32.const(1)
				)),

				// Break loop since hit count limit
				expr.count == "?" || expr.count == "1" ?
					ctx.m.br(block) :
					ctx.m.nop(),

				// Continue loop
				ctx.m.br(loop)
			]))
		]),

		// Update the reach
		ctx.m.call("_reach_update", [
			ctx.m.global.get("index", binaryen.i32)
		], binaryen.none),

		// Check satisfies count
		/*
			At this point given repetition:
				?, 1: Exited the loop once 1 had been reached, 0 -> 1
				*, +: Exited when failed so 0 -> many
		*/
		expr.count == "+" || expr.count == "1" ?
			ctx.m.if(
				ctx.m.i32.lt_s(
					ctx.m.local.get(count, binaryen.i32),
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

					ctx.m.global.set("heap", ctx.m.local.get(rewind, binaryen.i32)),
					ctx.m.br(outer)
				])
			):
			ctx.m.nop(),


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

		// Copy in the data
		ctx.m.call("_memcpy", [
			ctx.m.i32.add(
				ctx.m.local.get(rewind, binaryen.i32),
				ctx.m.i32.const(OFFSET.DATA)
			),
			ctx.m.i32.add(
				ctx.m.global.get("input", binaryen.i32),
				ctx.m.i32.load(
					OFFSET.START, 4,
					ctx.m.local.get(rewind, binaryen.i32)
				),
			),
			ctx.m.local.get(count, binaryen.i32),
		], binaryen.none),

		// Update new heap tail
		ctx.m.global.set("heap",
			ctx.m.call("_roundWord", [
				ctx.m.i32.add(
					ctx.m.local.get(rewind, binaryen.i32),
					ctx.m.i32.add(
						ctx.m.local.get(count, binaryen.i32),
						ctx.m.i32.const( OFFSET.DATA )
					)
				)
			], binaryen.i32)
		),
	]);

	if (expr.ref) ctx.bindDebug(out, expr.ref);
	return out;
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
	const literal = ctx.l.getKey(expr.value);

	if (literal.bytes.byteLength === 0) {
		return ctx.m.block(null, [
			ctx.m.local.set(error, ctx.m.i32.const(1))
		])
	}

	const rewind   = ctx.declareVar(binaryen.i32);
	const progress = ctx.declareVar(binaryen.i32);

	const type    = ctx.l.getKey("literal");

	const block = ctx.pushBlock();

	const out = ctx.m.block(block, [
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

		// Copy in the data
		ctx.m.call("_memcpy", [
			ctx.m.i32.add(
				ctx.m.local.get(rewind, binaryen.i32),
				ctx.m.i32.const(OFFSET.DATA)
			),
			ctx.m.i32.const(literal.offset),
			ctx.m.i32.const(literal.bytes.byteLength),
		], binaryen.none),

		// Update new heap tail
		ctx.m.global.set("heap",
			ctx.m.call("_roundWord", [
				ctx.m.i32.add(
					ctx.m.local.get(rewind, binaryen.i32),
					ctx.m.i32.const( OFFSET.DATA + literal.bytes.byteLength )
				)
			], binaryen.i32)
		),
	]);

	if (expr.ref) ctx.bindDebug(out, expr.ref);
	return out;
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
						ctx.m.i32.load(
							OFFSET.START, 4,
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






export function CompileRule(m: binaryen.Module, literals: LiteralMapping, rule: Rule, fileID?: number) {
	const ctx = new CompilerContext(m, literals, rule);
	ctx.enableDebugging(!!fileID);

	// Function input
	const error = ctx.declareVar(binaryen.i32);

	// Make sure all rules start with a sequence
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

	const innerWasm = CompileExpression(ctx, inner, rule.name);
	const entry = ctx.m.block(null, [
		ctx.m.local.set(error, ctx.m.i32.const(0)),

		// Auto grow if 1kb from end of memory
		ctx.m.if(
			ctx.m.i32.lt_s(
				ctx.m.i32.mul(
					ctx.m.memory.size(),
					ctx.m.i32.const(65_536) // bytes per page
				),
				ctx.m.i32.add(
					ctx.m.global.get("heap", binaryen.i32),
					ctx.m.i32.const(1024) // 1kb
				)
			),
			ctx.m.block(null, [
				rule.name === "expr_arg"
					? ctx.m.call("print_i32", [
						ctx.m.i32.sub(
							ctx.m.i32.mul(
								ctx.m.memory.size(),
								ctx.m.i32.const(65_536) // bytes per page
							),
							ctx.m.global.get("heap", binaryen.i32)
						)
					], binaryen.none)
					: ctx.m.nop(),
				ctx.m.drop( ctx.m.memory.grow(ctx.m.i32.const(1)) )
			])
		),

		innerWasm,

		ctx.m.return(ctx.m.local.get(error, binaryen.i32))
	]);
	if (rule.ref) ctx.bindDebug(entry, rule.ref);

	const funcID = ctx.m.addFunction(
		rule.name,
		binaryen.createType([]), binaryen.i32,
		ctx.vars,
		entry
	);
	ctx.m.addFunctionExport(rule.name, rule.name);

	if (fileID) ctx.applyDebugInfo(funcID, fileID);
}