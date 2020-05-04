let BNF = require('./index.js');


// Load the BNF file
const fs = require('fs');
let data = fs.readFileSync('./bnf.bnf', 'utf8');

// Parse the file and check for errors
let res = BNF.Parse(data, BNF.syntax);
if (res.hasError || res.isPartial) {
	console.error("BNF didn't parse correctly");
	process.exit(1);
}

// Compile the parsed result into a new tree
let syntax = BNF.Compile(res.tree);
fs.writeFileSync('bnf.json', JSON.stringify(syntax, null, 2));

// Print success
console.log('BNF syntax building completed');
process.exit(0);