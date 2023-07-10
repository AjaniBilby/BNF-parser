import { ParseError, helper } from "../legacy/index.js";
import { GenerateWasm } from "./compile.js";

export function Compile2Wasm(bnf: string) {
	const lang = helper.Compile(bnf);
	if (lang instanceof ParseError) return lang;
	return GenerateWasm(lang);
}