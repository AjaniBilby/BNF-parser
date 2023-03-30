
import { BNF, Compile, ParseError } from '../../source/';
import * as path from 'path';
import * as fs from 'fs';



let input = fs.readFileSync(path.join(__dirname, '/syntax.bnf'), 'utf8');

// BNF.setVerbose(true);
let res = BNF.parse(input);
if (res instanceof ParseError) {
	console.log(res.toString());
	process.exit(1);
}

let lang = Compile(res);
console.log(`"prop" ->`, lang.parse("prop", false, "attribute"));
console.log(`"prop::text" ->`, lang.parse("prop::text", false, "attribute"));


process.exit(0);