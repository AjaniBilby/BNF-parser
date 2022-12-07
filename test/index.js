const { execSync }  = require('child_process');
const path = require('path');


let tests = {
	"double-parse": ['node double-parse.js', {
		cwd: __dirname
	}],
	"Uniview": ['ts-node run.ts', {
		cwd: path.join(__dirname, "/uv")
	}]
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