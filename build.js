const fs = require('fs');
let data = fs.readFileSync('./bnf.bnf', 'utf8');
let tree = JSON.parse(fs.readFileSync('./bnf.json', 'utf8'));

let BNF = require('./index.js');

let res = BNF.Parse(data, tree, "program");
fs.writeFileSync('temp-tree.json', JSON.stringify(res, null, 2));

if (res.hasError || res.isPartial) {
	console.error("BNF didn't parse correctly");
	process.exit(1);
}


let syntax = BNF.Compile(res.tree);
fs.writeFileSync('bnf.json', JSON.stringify(syntax, null, 2));


console.log('BNF syntax building completed');
process.exit(0);