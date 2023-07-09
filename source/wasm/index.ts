import { BNF, ParseError, Compile } from "../index.js";
import { GenerateWasm } from "./compile.js";

import { writeFileSync } from "fs";
import * as Runner from "./run.js";

export function CompileBnf2Wasm(bnf: string) {
	const syntax = BNF.parse(bnf);
	if (syntax instanceof ParseError) throw syntax;

	const lang = Compile(syntax);

	return GenerateWasm(lang);
}


try {
	const myModule = CompileBnf2Wasm(`
	program ::= "Hello🦆People";
	integer ::= "0" | ...( "1" -> "9" "0" -> "9"* ) ;
`);

	// Optimize the module using default passes and levels
	// myModule.optimize();

	// Validate the module
	// if (!myModule.validate())
		// throw new Error("validation error");

	var textData = myModule.emitText();
	writeFileSync("out.wat", textData);

	Runner.Create(myModule.emitBinary())
		.then((wasm) => {
			const output = Runner.Parse(wasm, "Hello🦆People");
			console.log(29, output);

			if (output instanceof ParseError) {
				console.error(output.toString());
				process.exit(1);
			}

			writeFileSync("dump.json", JSON.stringify(output.root, null, 2));
		})
		.catch(console.error);
} catch (e: any) {
	console.error(e);
}