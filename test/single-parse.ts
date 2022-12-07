import { BNF, SyntaxNode, Compile } from '../source/index';
import * as path from 'path';
import * as fs from 'fs';



let input = fs.readFileSync(path.join(__dirname, '../bnf.bnf'), 'utf8');

// BNF.setVerbose(true);
let res = BNF.parse(input);

fs.writeFileSync(
	path.join(__dirname, './dump.json'),
	JSON.stringify(res, (key, value)=>{
		return key == "ref" ? undefined : value;
	}, 2),
'utf8');

if (res instanceof SyntaxNode) {
	let syntax = Compile(res);
	syntax.setVerbose(true);

	console.log("Parsed");

	fs.writeFileSync(
		path.join(__dirname, './dump-syntax.json'),
		JSON.stringify(syntax.serialize(), null, 2),
	'utf8');
} else {
	console.error(res.toString());
	process.exit(1);
}