let BNF = require('./index.js');


// Load the BNF file
const fs = require('fs');
let data = fs.readFileSync('./bnf.bnf', 'utf8');


let syntax;
try {
	syntax = BNF.Build(data);
} catch (e) {
	console.error(e);
	process.exit();
} finally {
	fs.writeFileSync('bnf.json', JSON.stringify(syntax));	

	// Print success
	console.log('BNF syntax building completed');
	process.exit(0);
}