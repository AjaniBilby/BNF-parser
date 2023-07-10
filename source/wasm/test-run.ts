import { writeFileSync } from "fs";

import { ParseError } from "../legacy/index.js";
import { Compile2Wasm } from "./index.js";
import * as Runner from "./run.js";

const bnf = `
program ::= %w* def+ ;
w ::= comment | " " | "\\t" | "\\n" | "\\r" ;
	comment ::= "#" !"\\n"* "\\n" ;

name ::= ...( letter ( letter | digit | "_" )* ) ;
	letter ::= "a"->"z" | "A"->"Z" ;
	digit ::= "0"->"9" ;
	hex   ::= "0"->"9" | "a"->"f" | "A"->"F" ;

constant ::= %"\\"" frag* %"\\"" ;
	frag   ::= escape | !"\\""+ ;
	escape ::= %"\\\\" !"" ;
	byte   ::= %"x" ...(hex hex) ;

def ::= name %(w+ "::=" w*) expr %(w* ";" w*) ;

expr ::= expr_arg %w* ( ...expr_infix? %w* expr_arg %w* )* ;
	expr_arg ::= expr_prefix ( ...constant | expr_brackets | name ) ...expr_suffix? ;
	expr_prefix ::= ..."%"? ..."..."? ..."!"? ;
	expr_infix  ::= "->" | "|" ;
	expr_suffix ::= "*" | "?" | "+" ;
	expr_brackets ::= %( "(" w* ) expr %( w* ")" ) ;
`;

let wasm: Runner.WasmParser | null = null;

const myModule = Compile2Wasm(bnf);
if (myModule instanceof ParseError) {
	console.error(myModule.toString());
	process.exit(1);
}

try {
	// Optimize the module using default passes and levels
	myModule.optimize();

	// Validate the module
	// if (!myModule.validate())
		// throw new Error("validation error");

	var bin = myModule.emitBinary();
	writeFileSync("out.wat", myModule.emitText());
	writeFileSync("out.wasm", bin);

	wasm = Runner.Create(bin);
} catch (e: any) {
	console.error("Error during compiling wasm");
	console.error(e);
	process.exit(1);
}


console.log(" ");
console.time('total');

const output = Runner.Parse(wasm, bnf, false);

// const output = Runner.Parse(wasm, bnf, false);
if (output instanceof ParseError) {
	console.error(output.toString());
	process.exit(1);
}

console.timeEnd('total');

console.log(29, output);
console.log(output.root.ref);

if (output instanceof ParseError) {
	console.error(output.toString());
	process.exit(1);
}

// console.log(`Start: ${output.root.start} End: ${output.root.end} Reached: ${Number(output.reach)}`);

writeFileSync("dump.json", JSON.stringify(output.root, null, 2));
writeFileSync("dump.js", Runner.toString());