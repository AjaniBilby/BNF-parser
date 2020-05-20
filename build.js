let BNF = require('./index.js');


// Load the BNF file
const fs = require('fs');
let data = fs.readFileSync('./bnf.bnf', 'utf8');

// Parse the file and check for errors
let res = BNF.Parse(data, BNF.syntax);
if (res.hasError || res.isPartial) {	
	let ref = null;
	if (res.tree instanceof BNF.types.BNF_SyntaxError) {
		ref = res.tree.ref;
	} else {
		ref = res.tree.ref.end;
	}

	let msg = `\nSyntax Error: BNF did not parse correctly due to a syntax error at ${ref.toString()}\n`;
	msg += "  " + BNF.Message.HighlightArea(data, ref).split('\n').join('\n  ');
	console.error(msg);

	process.exit(1);
}

// Compile the parsed result into a new tree
let syntax = BNF.Compile(res.tree);
fs.writeFileSync('bnf.json', JSON.stringify(syntax, null, 2));

// Print success
console.log('BNF syntax building completed');
process.exit(0);