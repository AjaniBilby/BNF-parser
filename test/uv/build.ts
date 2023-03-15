import { Compile, BNF, ParseError } from 'bnf-parser';
import * as fs from 'fs';


// BNF.setVerbose(true);
let res = BNF.parse(
	fs.readFileSync(__dirname+"/uniview.bnf", 'utf8'), false
);
if (res instanceof ParseError) {
	console.error("Language Syntax Parsing");
	console.error(res.toString());
	process.exit(1);
}
console.log("Parsed Language Syntax");

let syntax = Compile(res);

fs.writeFileSync(__dirname+"/syntax.json", JSON.stringify(syntax.serialize(), null, 2));
console.log("Compiled Language Syntax");
