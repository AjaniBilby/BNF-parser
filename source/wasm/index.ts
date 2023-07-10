import { readFileSync, writeFileSync } from "fs";
import binaryen from "binaryen";

import { BNF, ParseError, Compile } from "../legacy/index.js";
import { GenerateWasm } from "./compile.js";
import * as Runner from "./run.js";

export function CompileBnf2Wasm(bnf: string) {
	console.time('process');
	const syntax = BNF.parse(bnf);
	if (syntax instanceof ParseError) throw syntax;
	console.timeEnd('process');

	const lang = Compile(syntax);
	writeFileSync("lang-dump.json", JSON.stringify(lang.serialize(), null, 2));

	return GenerateWasm(lang);
}

// const bnf_txt = readFileSync("./bnf.bnf", "utf8");

let myModule: binaryen.Module;
try {
	myModule = CompileBnf2Wasm(
`program ::= letter ;
name ::= letter ( letter | digit | "_" )+ ;
letter ::= "a"->"z" | "A"->"Z" ;
digit ::= "0"->"9" ; `)
// 	);
// 	myModule = CompileBnf2Wasm(`program ::= "\\"" !"\\""* "\\"" ; `)

	// Optimize the module using default passes and levels
	// myModule.optimize();

	// Validate the module
	// if (!myModule.validate())
		// throw new Error("validation error");

	var textData = myModule.emitText();
	writeFileSync("out.wat", textData);

	Runner.Create(myModule.emitBinary())
		.then((wasm) => {
			console.time('process');
			const output = Runner.Parse(wasm, `program ::= "Hello world"`, false);
			console.timeEnd('process');
			console.log(29, output);

			if (output instanceof ParseError) {
				console.error(output.toString());
				process.exit(1);
			}

			// console.log(`Start: ${output.root.start} End: ${output.root.end} Reached: ${Number(output.reach)}`);

			writeFileSync("dump.json", JSON.stringify(output.root, null, 2));
		})
		.catch(console.error);
} catch (e: any) {
	console.error("Error during compiling wasm");
	console.error(e);
	process.exit(1);
}