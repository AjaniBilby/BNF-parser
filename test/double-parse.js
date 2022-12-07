const { BNF, SyntaxNode, Compile } = require("../bin/index.js");
const path = require('path');
const fs = require('fs');


let input = fs.readFileSync(path.join(__dirname, '../bnf.bnf'), 'utf8');

BNF.setVerbose(true);
let res = BNF.parse(input);
if (res instanceof SyntaxNode) {
	let syntax = Compile(res);
	syntax.setVerbose(true);

	let test = syntax.parse(input);
	if (test instanceof SyntaxNode) {
		console.log("Double parse successful");
		Compile(test);
		console.log("Double build successful");
	} else {
		console.error(test.toString());
		process.exit(1);
	}
} else {
	console.error(res.toString());
	process.exit(1);
}