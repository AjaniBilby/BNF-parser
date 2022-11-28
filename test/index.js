const { execSync }  = require('child_process');
const path = require('path');


let tests = [
	['node double-parse.js', {
		cwd: __dirname
	}],
	['node run.js', {
		cwd: path.join(__dirname, "/uv")
	}]
];

let failed = false;

for (let test of tests) {
	console.log(`${test[0]}`);

	test[1].stdio = [null, null, null];

	let res;
	try {
		res = execSync(test[0], test[1]);
	} catch (e) {
		console.error("  "+
			e.stderr
				.toString()
				.replace(/\n+/g, " \n")
		);

		console.log('  Failed\n');
		failed = true;
	} finally {
		console.log("  Passed\n");
	}
}


process.exit(failed ? 1 : 0);