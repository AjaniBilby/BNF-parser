import { SyntaxNode, ParseError, Reference, ReferenceRange } from "./syntax";
import { Compile } from "./compiler";
import { Parser } from "./parser";

import { bnf_json } from "./preload";

const BNF = new Parser( bnf_json );


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