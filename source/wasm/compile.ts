import binaryen from "binaryen";

import LiteralMapping from "~/wasm/literal-mapping.js";
import { CompileRule } from "~/wasm/rule.js";
import { Parser } from "~/legacy/parser.js";
import { OFFSET } from "~/wasm/layout.js";





function IngestLiterals(m: binaryen.Module, bnf: Parser) {
	const literals = new LiteralMapping();
	literals.ingestBnf(bnf);

	m.setMemory(1, 10, "memory",
		literals.values
			.filter(x => x.bytes.byteLength > 0)
			.map(x => ({
				data: x.bytes,
				offset: m.i32.const(x.offset)
			}))
	);

	m.addGlobal("input",       binaryen.i32, false, m.i32.const(literals.size));
	m.addGlobal("reach",       binaryen.i32, true,  m.i32.const(0));
	m.addGlobal("inputLength", binaryen.i32, true,  m.i32.const(0));
	m.addGlobalExport("input", "input");
	m.addGlobalExport("reach", "reach");
	m.addGlobalExport("inputLength", "inputLength");

	m.addGlobal("heap",        binaryen.i32, true,  m.i32.const(0));
	m.addGlobal("index",       binaryen.i32, true,  m.i32.const(0));
	m.addGlobal("inputEnd",    binaryen.i32, true,  m.i32.const(0));

	if (true) {
		m.addGlobalExport("heap", "heap");
		m.addGlobalExport("index", "index");
		m.addGlobalExport("inputEnd", "inputEnd");
	}

	return literals;
}

function GenerateInit(m: binaryen.Module) {
	m.addFunction("_init",
		binaryen.none, binaryen.i32, [], m.block(null, [
			m.global.set("index", m.i32.const(0)),
			m.global.set("reach", m.i32.const(0)),
			m.global.set("inputEnd",
				m.i32.add(
					m.global.get("input", binaryen.i32),
					m.global.get("inputLength", binaryen.i32),
				)
			),
			m.global.set("heap",
				m.call("_roundWord", [
					m.global.get("inputEnd", binaryen.i32)
				], binaryen.i32)
			),

			m.return(
				m.global.get("heap", binaryen.i32)
			)
		])
	);
}
function GenerateRoundWord(m: binaryen.Module) {
	m.addFunction("_roundWord",
		binaryen.createType([binaryen.i32]), binaryen.i32, [], m.block(null, [
		m.return(
			m.i32.and(
				m.i32.add(
					m.local.get(0, binaryen.i32),
					m.i32.const(3)
				),
				m.i32.const(-4)
			)
		)
	]));
}
function GenerateMaxI32(m: binaryen.Module) {
	m.addFunction("_max_i32",
		binaryen.createType([binaryen.i32, binaryen.i32]), binaryen.i32, [],
		m.block(null, [
			m.return(
				m.select(
					m.i32.ge_s(
						m.local.get(0, binaryen.i32),
						m.local.get(1, binaryen.i32)
					),
					m.local.get(0, binaryen.i32),
					m.local.get(1, binaryen.i32)
				)
			)
		]
	));
}
function GenerateMemCopy(m: binaryen.Module) {
	m.addFunction("_memcpy",
		binaryen.createType([binaryen.i32, binaryen.i32, binaryen.i32]),
		binaryen.none,
		[
			binaryen.i32
		],
		m.block(null, [
			m.local.set(3, m.i32.const(0)),

			m.block("outer", [
				m.loop("loop", m.block(null, [
					m.i32.store8(
						0, 0,
						m.i32.add(m.local.get(0, binaryen.i32), m.local.get(3, binaryen.i32)),
						m.i32.load8_u(
							0, 0,
							m.i32.add(m.local.get(1, binaryen.i32), m.local.get(3, binaryen.i32))
						)
					),
					m.local.set(3,
						m.i32.add(
							m.local.get(3, binaryen.i32),
							m.i32.const(1)
						)
					),
					m.br_if("outer",
						m.i32.ge_s(
							m.local.get(3, binaryen.i32),
							m.local.get(2, binaryen.i32)
						)
					),
					m.br("loop")
				]))
			])
		]
	));
}

function GenerateMatchString(m: binaryen.Module) {
	const input     = 0;
	const target    = 1;
	const targetLen = 2;
	const count     = 3;

	m.addFunction("_matchString",
		binaryen.createType([binaryen.i32, binaryen.i32, binaryen.i32]), binaryen.i32, [
			binaryen.i32,
			binaryen.i32
		],
		m.block(null, [
			// Make input index point absolute memory address
			m.local.set(input, m.i32.add(
				m.local.get(input, binaryen.i32),
				m.global.get("input", binaryen.i32)
			)),
			m.local.set(count, m.i32.const(0)),

			m.block("outer", [
				m.loop("loop", m.block(null, [
					m.br_if("outer",
						m.i32.ne(
							m.i32.load8_u(0, 1,
								m.i32.add(
									m.local.get(input, binaryen.i32),
									m.local.get(count, binaryen.i32)
								)
							),
							m.i32.load8_u(0, 1,
								m.i32.add(
									m.local.get(target, binaryen.i32),
									m.local.get(count,  binaryen.i32)
								)
							),
						),
					),

					// Successful match, increment count
					m.local.set(count,
						m.i32.add(
							m.local.get(count, binaryen.i32),
							m.i32.const(1)
						)
					),

					// Bounds check
					m.br_if("outer",
						m.i32.ge_s(
							m.local.get(count,     binaryen.i32),
							m.local.get(targetLen, binaryen.i32)
						)
					),
					m.br_if("outer",
						m.i32.ge_s(
							m.i32.add(
								m.local.get(input, binaryen.i32),
								m.local.get(count, binaryen.i32),
							),
							m.global.get("inputEnd", binaryen.i32)
						)
					),
					m.br("loop")
				]))
			]),

			m.return( m.local.get(count, binaryen.i32) )
		]
	));
}

function GenerateReachUpdate(m: binaryen.Module) {
	m.addFunction("_reach_update", binaryen.createType([binaryen.i32]), binaryen.none, [],
		m.block(null, [
			m.if (
				m.i32.ge_s(
					m.local.get(0, binaryen.i32),
					m.global.get("reach", binaryen.i32)
				),
				m.block(null, [
					m.global.set("reach", m.local.get(0, binaryen.i32))
				])
			)
		])
	);
}

function GenerateGather(m: binaryen.Module, l: LiteralMapping) {
	const nodePtr  = 0;
	const writePtr = 1;
	const startPtr = 2;
	const bytes    = 3;
	const count    = 4;

	const literal = l.getKey("literal");

	// The nodes are already a flat-packed tree
	// So just loop over the tree brining all of the data forwards over the top of itself

	m.addFunction("_gather", binaryen.createType([binaryen.i32, binaryen.i32]), binaryen.i32, [
		binaryen.i32,
		binaryen.i32,
		binaryen.i32,
	],
		m.block(null, [
			m.local.set(startPtr, m.local.get(writePtr, binaryen.i32)),


			// Read node's count
			m.local.set(count, m.i32.const(1)),

			m.block("outer", [
				m.loop("loop", m.block(null, [
					m.if(
						m.i32.eq(
							m.i32.load(
								OFFSET.TYPE, 4,
								m.local.get(nodePtr, binaryen.i32)
							),
							m.i32.const(literal.offset)
						),
						// If node is literal
						m.block(null, [
							m.local.set(bytes, m.i32.load(
								OFFSET.COUNT, 4,
								m.local.get(nodePtr, binaryen.i32),
							)),

							// Write the data
							m.call("_memcpy", [
								m.local.get(writePtr, binaryen.i32),
								m.i32.add(
									m.local.get(nodePtr, binaryen.i32),
									m.i32.const( OFFSET.DATA ),
								),
								m.local.get(bytes, binaryen.i32)
							], binaryen.none),

							// Update the write pointer
							m.local.set(writePtr,
								m.i32.add(
									m.local.get(writePtr, binaryen.i32),
									m.local.get(bytes, binaryen.i32)
								)
							),

							// Jump to the next node
							m.local.set(nodePtr, m.call("_roundWord", [
								m.i32.add(
									m.local.get(nodePtr, binaryen.i32),
									m.i32.add(
										m.i32.const(OFFSET.DATA),
										m.local.get(bytes, binaryen.i32)
									)
								)
							], binaryen.i32))
						]),

						// If node is something else it will be nested
						m.block(null, [
							// Add children count to the total number of nodes to be processed
							m.local.set(count,
								m.i32.add(
									m.local.get(count, binaryen.i32),
									m.i32.load(
										OFFSET.COUNT, 4,
										m.local.get(nodePtr, binaryen.i32)
									),
								)
							),

							// Step forwards one node
							m.local.set(nodePtr, m.i32.add(
								m.local.get(nodePtr, binaryen.i32),
								m.i32.const(OFFSET.DATA)
							))
						])
					),

					m.local.set(count, m.i32.sub(
						m.local.get(count, binaryen.i32),
						m.i32.const(1)
					)),

					// Ran out of nodes to consume
					m.br("outer", m.i32.eq(
						m.local.get(count, binaryen.i32),
						m.i32.const(0)
					)),

					m.br("loop")
				]))
			]),

			m.return(m.i32.sub(
				m.local.get(writePtr, binaryen.i32),
				m.local.get(startPtr, binaryen.i32)
			))
		])
	);
}

function GenerateInternals(m: binaryen.Module, l: LiteralMapping) {
	GenerateInit(m);
	// GenerateMaxI32(m);
	GenerateRoundWord(m);
	GenerateMemCopy(m);
	GenerateMatchString(m);
	GenerateReachUpdate(m);
	GenerateGather(m, l);

	m.addFunctionExport("_init", "_init");
}



export function GenerateWasm(bnf: Parser, debug = false) {
	var m = new binaryen.Module();

	m.setFeatures(binaryen.Features.MutableGlobals);
	const fileID = debug
		? m.addDebugInfoFileName("source.bnf")
		: undefined;

	m.setMemory(1, 1);
	m.addFunctionImport("print_i32", "js", "print_i32", binaryen.createType([binaryen.i32]), binaryen.none);

	const literals = IngestLiterals(m, bnf);
	GenerateInternals(m, literals);

	for (let [_, rule] of bnf.terms) {
		CompileRule(m, literals, rule, fileID);
	}

	return m;
}