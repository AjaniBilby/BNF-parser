import { BNF, Compile, SyntaxNode } from "../bin/legacy/index.js";

import * as fs from "fs";

let input = fs.readFileSync('./bnf.bnf', 'utf8');

let res = BNF.parse(input);
if (res instanceof SyntaxNode) {
	let syntax = Compile(res);
	syntax.setVerbose(true);

	fs.writeFileSync( './bnf.json', JSON.stringify(syntax.serialize()) );
} else {
	console.error(res.toString());
	process.exit(1);
}