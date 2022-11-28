const { Compile, BNF, ParseError } = require('../../bin/index.js');
const fs = require('fs');


let res = BNF.parse(
	fs.readFileSync(__dirname+"/uniview.bnf", 'utf8'), false
);
if (res instanceof ParseError) {
	console.error(res.toString());
	process.exit(1);
}

let syntax = Compile(res);
syntax.setVerbose(true);

let out = syntax.parse(fs.readFileSync(__dirname+"/sample.uv", 'utf8'));
if (out instanceof ParseError) {
	console.error(out.toString());
	process.exit(1);
}