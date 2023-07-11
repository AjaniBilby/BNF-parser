import * as Shared from "../dist/shared.js"; // things shared between multiple pre-compiled BNFs
import * as bnf from "../dist/bnf.js";       // pre-compiled JS with WASM embedded

import { readFileSync, writeFileSync } from "fs";


const data = readFileSync("./bnf.bnf", "utf8");

// console.log(bnf.program);
const syntax = bnf.program(data);
if (syntax instanceof Shared.ParseError) {
	console.error(syntax.toString());
	process.exit(1);
}
console.log(syntax);

writeFileSync("./dump.json", JSON.stringify(syntax, null, 2));
