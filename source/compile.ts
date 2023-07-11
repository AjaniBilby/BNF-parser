import * as Shared from "../dist/shared.js"; // things shared between multiple pre-compiled BNFs
import * as bnf from "../dist/bnf.js";       // pre-compiled JS with WASM embedded


const data = `
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

// console.log(bnf.program);
const syntax = bnf.program(data);
if (syntax instanceof Shared.ParseError) {
	console.error(syntax.toString());
	process.exit(1);
}
console.log(syntax);
const defs = syntax.root.value[0];
const def  = defs.value[0];
const name = def.value[0];





const leaf = name.value;