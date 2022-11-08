import { BNF, Compile, SyntaxNode } from "./index.js";

import * as path from "path";
import * as fs from "fs";


let Getopt = require("node-getopt");


let getopt = new Getopt([
	['', 'verify', 'Verify it builds only, do not save results']
]).bindHelp();


let input = fs.readFileSync(path.join(__dirname, '../bnf.bnf'), 'utf8');

let res = BNF.parse(input);
if (res instanceof SyntaxNode) {
	let syntax = Compile(res);

	if (getopt['options']['verify']) {
		let test = syntax.parse(input);
		if (test instanceof SyntaxNode) {
			console.log("Double build successful");
		} else {
			console.error(res.toString());
			process.exit(1);
		}
	} else {
		fs.writeFileSync(path.join(__dirname, '../bnf.json'), JSON.stringify(syntax.serialize()));
	}
} else {
	console.error(res.toString());
	process.exit(1);
}