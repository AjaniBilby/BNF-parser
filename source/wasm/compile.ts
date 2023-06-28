import binaryen from "binaryen";

import LiteralMapping from "./literal-mapping.js";
import { CompileRule } from "./rule.js";
import { Parser } from "../parser";





function IngestLiterals(m: binaryen.Module, bnf: Parser) {
	const literals = new LiteralMapping();
	literals.ingestBnf(bnf);

	m.setMemory(1, 10, "memory",
		literals.values.map(x => ({
			data: x.bytes,
			offset: m.i32.const(x.offset)
		}))
	);

	m.addGlobal("input",       binaryen.i32, false, m.i32.const(literals.size));
	m.addGlobal("inputLength", binaryen.i32, true,  m.i32.const(0));
	m.addGlobal("heap",        binaryen.i32, true,  m.i32.const(0));
	m.addGlobal("reach",       binaryen.i32, true,  m.i32.const(0));
	m.addGlobalExport("input", "input");
	m.addGlobalExport("reach", "reach");
	m.addGlobalExport("inputLength", "inputLength");

	return literals;
}

function GenerateInternals(m: binaryen.Module) {
	m.addFunction("_init",
		binaryen.none, binaryen.i32, [], m.block(null, [
		m.global.set("heap",
			m.call("_roundWord", [
				m.i32.add(
					m.global.get("inputLength", binaryen.i32),
					m.global.get("input", binaryen.i32),
				)
			], binaryen.i32)
		),
		m.global.set("reach", m.i32.const(0)),
		m.return(
			m.global.get("heap", binaryen.i32)
		)
	]));

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

	m.addFunction("_max_i32",
		binaryen.createType([binaryen.i32, binaryen.i32]), binaryen.i32, [],
		m.block(null, [
			m.select(
				m.i32.ge_s(
					m.local.get(0, binaryen.i32),
					m.local.get(1, binaryen.i32)
				),
				m.local.get(0, binaryen.i32),
				m.local.get(1, binaryen.i32)
			)
		]
	));

	m.addFunctionExport("_init", "_init");

	m.addFunction("_matchString",
		binaryen.createType([binaryen.i32, binaryen.i32, binaryen.i32]), binaryen.i32, [
			binaryen.i32
		],
		m.block(null, [
			m.local.set(0, m.i32.add(
				m.local.get(0, binaryen.i32),
				m.global.get("input", binaryen.i32)
			)),
			m.local.set(3, m.i32.const(0)),

			m.block("outer", [
				m.loop("loop", m.block(null, [
					m.call("print_i32", [
						m.i32.add(
							m.local.get(0, binaryen.i32),
							m.local.get(3, binaryen.i32)
						)
					], binaryen.none),
					m.br_if("outer",
						m.i32.ne(
							m.i32.load8_u(0, 1,
								m.i32.add(
									m.local.get(0, binaryen.i32),
									m.local.get(3, binaryen.i32)
								)
							),
							m.i32.load8_u(0, 1,
								m.i32.add(
									m.local.get(1, binaryen.i32),
									m.local.get(3, binaryen.i32)
								)
							),
						),
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
					m.br_if("outer",
						m.i32.ge_s(
							m.i32.add(
								m.local.get(0, binaryen.i32),
								m.local.get(3, binaryen.i32),
							),
							m.global.get("heap", binaryen.i32)
						)
					),
					m.br("loop")
				]))
			]),
			m.local.get(3, binaryen.i32)
		]
	));
}



export function GenerateWasm(bnf: Parser) {
	var m = new binaryen.Module();
	m.setMemory(1, 1);
	m.addFunctionImport("print_i32", "js", "print_i32", binaryen.createType([binaryen.i32]), binaryen.none);

	const literals = IngestLiterals(m, bnf);
	GenerateInternals(m);

	for (let [_, rule] of bnf.terms) {
		CompileRule(m, literals, rule);
	}

	return m;
}