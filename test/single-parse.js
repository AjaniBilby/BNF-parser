const { BNF, SyntaxNode, Compile } = require("../bin/index.js");
const path = require('path');
const fs = require('fs');


let input = fs.readFileSync(path.join(__dirname, '../bnf.bnf'), 'utf8');

// BNF.setVerbose(true);
let res = BNF.parse(input);
if (res instanceof SyntaxNode) {
	let syntax = Compile(res);
	syntax.setVerbose(true);

	console.log("Parsed");
} else {
	console.error(res.toString());
	process.exit(1);
}