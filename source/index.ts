import * as path from "path";
import * as fs from "fs";

import { SyntaxNode, ParseError, Reference, ReferenceRange } from "./syntax";
import { Compile } from "./compiler";
import { Parser } from "./parser";

const BNF = new Parser(
	JSON.parse(fs.readFileSync(
		path.join(__dirname, '../bnf.json'),
		'utf8'
	))
);


export {
	BNF,
	Parser,
	Compile,
	SyntaxNode,
	ParseError,
	Reference,
	ReferenceRange,
};