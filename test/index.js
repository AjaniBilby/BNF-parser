import { execSync } from "child_process";
import * as path from "path";

const cwd = path.dirname(process.argv[1]);
let tests = {
	"BNF compilations": ['npx bnf-compile ./bnfs/', { cwd }],
	"Double Parse":     ['node double-parse.js',    { cwd }],
	// "Uniview Parse":    ['node ./uv/index.js',      { cwd }],
};

let failed = false;

for (let key in tests) {
	let test = tests[key];
	console.log(key);

	test[1].stdio = [null, null, null];

	let res;
	try {
		res = execSync(test[0], test[1]);
		console.log("  Passed\n");
	} catch (e) {
		console.error("  "+
			e.stderr
				.toString()
				.replace(/\n+/g, " \n")
		);

		console.log('  Failed\n');
		failed = true;
	}
}


process.exit(failed ? 1 : 0);