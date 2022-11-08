const path = require('path');
const fs = require('fs');

import { Parser } from "./parser";
import { SyntaxNode } from "./syntax";

const BNF_SYNTAX = new Parser(
	JSON.parse(fs.readFileSync(
		path.join(__dirname, '../bnf-hand.json'),
		'utf8'
	))
);


let input = fs.readFileSync(path.join(__dirname, '../basic.bnf'), 'utf8');

let res = BNF_SYNTAX.parse(input, true, "program");
if (res instanceof SyntaxNode) {
	console.log(res);
	console.log(res.flat());
} else {
	console.log(res.toString());
}

// console.log(14, res);