import { BNF, Compile, SyntaxNode } from "./index.js";

const path = require('path');
const fs = require('fs');




let input = fs.readFileSync(path.join(__dirname, '../bnf.bnf'), 'utf8');

console.log("Parse 1");
let res = BNF.parse(input);
if (res instanceof SyntaxNode) {
	let syntax = Compile(res);
	// fs.writeFileSync('dump.json', JSON.stringify(syntax.serialize()));
} else {
	console.log(res.toString());
}