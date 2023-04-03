import { Compile, BNF, ParseError, SyntaxNode } from 'bnf-parser';
import * as fs from 'fs';


const data = fs.readFileSync(
	// __dirname+"/short.xml",
	// "P:\\Documents\\school\\UTS\\Course\\Social and Information Network\\simplewiki-latest-pages-articles.xml",
	"utf8"
);

// BNF.setVerbose(true);
let res = BNF.parse(
	fs.readFileSync(__dirname+"/xml.bnf", 'utf8'), false
);
if (res instanceof ParseError) {
	console.error("Language Syntax Parsing");
	console.error(res.toString());
	process.exit(1);
}
console.log("Parsed Language XML");

const syntax = Compile(res);
let offset = 0;

function Consume(type: string): SyntaxNode {
	let res = syntax.parse(data.slice(offset), true, type);
	if (res instanceof ParseError) {
		console.error(type, res);
		console.info(
			data.slice(res.ref.start.index+offset, res.ref.end.index+offset + 100)
		);
		process.exit(1);
	}

	let nx = ( res.ref.end.index || 0 );
	console.log(`consumed "${data.slice(offset, offset+nx)}"`);
	offset += nx;

	return res;
}

console.log(Consume("element_start"));
fs.writeFileSync("temp.json", JSON.stringify(Consume("reader"), (key, value) =>{
	if (key == "ref" || key == "reach") {
		return undefined;
	}
	return value;
}, 2));


// console.log(syntax.parse("<end>fas<b>t</b></end>", false, "element"))
