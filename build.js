const Getopt = require('node-getopt');
let getopt = new Getopt([
	['', 'verify', 'Verify it builds only, do not save results'],
	['', 'test', 'Builds the BNF syntax, then attempts to rebuild using new syntax'],
]).bindHelp();
let opt = getopt.parse(process.argv.slice(2));

let BNF = require('./index.js');


// Load the BNF file
const fs = require('fs');
let data = fs.readFileSync('./bnf-v2.bnf', 'utf8');


let syntax;
try {
	console.log(18);
	syntax = BNF.Build(data);
	console.log("BUILT");
} catch (e) {
	console.error(e);
	process.exit(1);
} finally {
	if (opt.options.verify) {
		console.log("Syntax build successful");
	} else if (opt.options.test) {
		try {
			console.log("First build successful\n");
			BNF.Build(data, null, syntax);
		} catch (e) {
			console.error(e);
			process.exit(1);
		} finally {
			console.log("Success");
		}
	} else {
		console.log('BNF syntax building completed');
		fs.writeFileSync('bnf-v2.json', JSON.stringify(syntax));
		console.log('Overwrote syntax');
	}
}