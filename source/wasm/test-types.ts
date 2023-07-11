import { readFileSync, writeFileSync } from "fs";

import { ParseError } from "../legacy/index.js";
import { helper } from "../legacy/index.js";

import * as types from "./types.js";

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


const lang = helper.Compile(bnf);
if (lang instanceof ParseError) {
	console.error(lang.toString());
	process.exit(1);
}

writeFileSync("./dump.d.ts", types.CompileTypes(lang));