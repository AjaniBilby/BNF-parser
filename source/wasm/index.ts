import { GenerateWasm } from "./compile.js";
import { CompileTypes } from "../types.js";
import { CompileProgram } from "../compile.js";
import * as Runner from "./run.js";

import { ParseError, ReferenceRange, Reference } from "../artifacts/shared.js";

// Pre-compiled bnf parser components
import * as Shared from "../../dist/shared.js"; // things shared between multiple pre-compiled BNFs
import * as bnf from "../../dist/bnf.js";       // pre-compiled JS with WASM embedded

export function Compile2Wasm(inputBnf: string) {
	const syntax = bnf.Parse_Program(inputBnf, true);
	if (syntax instanceof Shared.ParseError) {
		const convert = new ParseError(syntax.msg, syntax.ref);
		convert.stack = syntax.stack;
		return convert;
	}

	if (syntax.isPartial) {
		return new ParseError("Unexpected syntax at", new ReferenceRange(
			syntax.root.ref?.end || new Reference(0,0,0),
			new Reference(0,0, syntax.reachBytes)
		))
	}

	try {
		const lang = CompileProgram(syntax.root);

		return GenerateWasm(lang);
	} catch (e) {
		if (e instanceof ParseError) return e;
		throw e;
	}
}

export {
	GenerateWasm,
	CompileTypes,
	Runner
}