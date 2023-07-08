import { BNF, ParseError, Compile } from "../index.js";
import { GenerateWasm } from "./compile.js";

import { writeFileSync } from "fs";
import * as Runner from "./run.js";

const syntax = BNF.parse(`program ::= "a"+ "b"+;`);
if (syntax instanceof ParseError) throw syntax;

const bnf = Compile(syntax);



try {
	const myModule = GenerateWasm(bnf);

	// Optimize the module using default passes and levels
	// myModule.optimize();

	// Validate the module
	// if (!myModule.validate())
	// 	throw new Error("validation error");


	var textData = myModule.emitText();
	writeFileSync("out.wat", textData);

	Runner.Create(myModule.emitBinary())
		.then((wasm) => {
			console.log(29, Runner.Parse(wasm, "aaaabbbb"));
		})
		.catch(console.error);
} catch (e: any) {
	console.error(e);
}