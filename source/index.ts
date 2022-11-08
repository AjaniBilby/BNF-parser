const path = require('path');
const fs = require('fs');

import { Compile } from "./compiler";
import { Parser } from "./parser";
import { SyntaxNode } from "./syntax";

const BNF_SYNTAX = new Parser(
	JSON.parse(fs.readFileSync(
		path.join(__dirname, '../dump.json'),
		'utf8'
	))
);


let input = fs.readFileSync(path.join(__dirname, '../bnf-v2.bnf'), 'utf8');

console.log("Parse 1");
let res = BNF_SYNTAX.parse(input);
if (res instanceof SyntaxNode) {
	let syntax = Compile(res);
	// fs.writeFileSync('dump.json', JSON.stringify(syntax.serialize()));
} else {
	console.log(res.toString());
}
