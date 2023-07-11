import { ParseError, helper } from "../legacy/index.js";
import { GenerateWasm } from "./compile.js";
import { CompileTypes } from "./types.js";
import * as Runner from "./run.js";

export function Compile2Wasm(bnf: string) {
	const lang = helper.Compile(bnf);
	if (lang instanceof ParseError) return lang;
	return GenerateWasm(lang);
}

export {
	GenerateWasm,
	CompileTypes,
	Runner
}