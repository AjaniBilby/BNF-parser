import { BNF, Compile, SyntaxNode } from "../bin/index";

import * as path from "path";
import * as fs from "fs";

let input = fs.readFileSync(path.join(__dirname, '../bnf.bnf'), 'utf8');

let res = BNF.parse(input);
if (res instanceof SyntaxNode) {
	let syntax = Compile(res);
	syntax.setVerbose(true);

	fs.writeFileSync(
		path.join(__dirname, '../bnf.json'),
		JSON.stringify(syntax.serialize())
	);
} else {
	console.error(res.toString());
	process.exit(1);
}