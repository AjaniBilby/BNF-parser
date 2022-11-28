import { BNF, Compile, SyntaxNode } from "./index.js";

import * as path from "path";
import * as fs from "fs";


import * as getopts from "getopts";

let opt = getopts(process.argv.slice(2), { });

let input = fs.readFileSync(path.join(__dirname, '../bnf.bnf'), 'utf8');

let res = BNF.parse(input);
if (res instanceof SyntaxNode) {
	let syntax = Compile(res);
	syntax.setVerbose(opt.verbose);

	fs.writeFileSync(path.join(__dirname, '../bnf.json'), JSON.stringify(syntax.serialize()));
} else {
	console.error(res.toString());
	process.exit(1);
}