let BNF = require('./index.js');


// Load the BNF file
const fs = require('fs');
let data = fs.readFileSync('./bnf.bnf', 'utf8');


let first_build;
try {
	first_build = BNF.Build(data, "bnf.bnf");
} catch (e) {
	console.error(e);
	process.exit();
} finally {
	// Print success
	console.log('First build successful');
}

let second_build;
try {
	second_build = BNF.Build(data, "bnf.bnf", first_build);
} catch (e) {
	console.error(e);
	process.exit();
} finally {
	// Print success
	console.log('Second build successful');
}