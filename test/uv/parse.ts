import { Parser, ParseError } from '../../source/index';
import * as fs from 'fs';


// BNF.setVerbose(true);
let syntax = new Parser(
	JSON.parse(
		fs.readFileSync(__dirname+'/syntax.json', 'utf8')
	)
);
console.log("Loaded Language");

let out = syntax.parse(fs.readFileSync(__dirname+"/sample.uv", 'utf8'));
if (out instanceof ParseError) {
	console.error("Language Parsing");
	console.error(out.toString());
	process.exit(1);
} else {
	console.log("Parsed Language");
	let filter = function (key: string, value: any) {
		return key == "ref" ? undefined : value;
	}

	let data = JSON.stringify(
		out,
		filter,
		2
	);

	fs.writeFileSync(__dirname+'/dump.json', data);
}