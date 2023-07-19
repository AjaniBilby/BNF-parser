import * as Shared from "./bnfs/shared.js";
import * as Parser from "./bnfs/lolcode.js";

import chalk from 'chalk';

const samples = [
// Example 1
`HAI
	VISIBLE "HAI WORLD!"
KTHXBYE`,

// Example 2
`HAI
	I HAZ A n
KTHXBYE`,

// Example 3
`HAI
	I HAZ A number ITZ 3
KTHXBYE`,

// Example 4
`HAI
	GIMMEH number
	I HAZ A even ITZ MOD OF number AN 2
	O RLY? even
		YA RLY
			VISIBLE "ITZ EVEN"
		NO WAI
			VISIBLE "NOZ EVEN"
	OIC
KTHXBYE`,

// Example 5
`HAI
	GIMMEH number
	IM IN YR loop WILE WIN
		number R SUM OF number AN 1
		VISIBLE number
	IM OUTTA YR loop
KTHXBYE`,

// Example 6
`HAI
	VISIBLE "U SEE THIS"
	BTW VISIBLE "U SEE NOTHING"
	OBTW
		VISIBLE "U SEE NOTHIN"
		VISIBLE "U STIL SEE NOTHIN"
	TLDR
	VISIBLE "U SEE THIS"
KTHXBYE`
];


function ColorizeError(msg) {
	let index = msg.indexOf(":");
	if (index === -1) index = 0;

	return chalk.red(msg.slice(0, index)) + msg.slice(index);
}


let failure = false;
for (let idx in samples) {
	const sample = samples[idx];
	const num = Number(idx) + 1;

	try {
		const syntax = Parser.Parse_Program(sample, true);

		if (syntax instanceof Shared.ParseError) {
			const line = sample.split("\n")[syntax.ref.end.line-1];
			console.error(`   Sample ${num}`);
			console.error(`   ${ColorizeError(syntax.toString())}`);
			console.error(`     `, line);
			console.error("");
			failure = true;
			continue;
		}
		if (syntax.isPartial) {
			console.error(`   Sample ${num}`);
			console.error(`   ${chalk.red("Failed")} to finish parsing at ${syntax.root.ref.end.toString()} reached ${syntax.reach?.toString()}`);
			console.error("");
			failure = true;
			continue;
		}
	} catch (e) {
		console.error(`   Sample ${num}`);
		console.error(`   ${ColorizeError(e.toString())}`);
		failure = true;
		continue;
	}
}

if (failure) process.exit(1);