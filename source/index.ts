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


import { PromiseQueue } from "./lib/promise-queue";
import { StreamCache } from "./lib/cache";
const experimental = {
	StreamCache,
	PromiseQueue
};

export {
	BNF,
	Parser,
	Compile,
	SyntaxNode,
	ParseError,
	Reference,
	ReferenceRange,
	experimental
};