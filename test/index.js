import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";
import chalk from "chalk";
import fs from "node:fs";

const cwd = path.dirname(process.argv[1]);



function CompileBNFs(){
	console.log("Compiling BNFs");
	try {
		console.log(execSync("node ../bin/cli.js ./bnf/", { cwd }).toString());
	} catch (e) {
		console.error(e.stdout.toString());
		console.error("Failed to compile BNFs\n\n");
		console.error(e.stderr.toString());
		process.exit(1);
	}
}




async function SampleTests() {
	const syntaxes = fs.readdirSync(`${cwd}/bnf`)
		.filter(x => x.endsWith(".bnf"))
		.map(x => x.slice(0, -4));

	const Shared = await import(pathToFileURL(`${cwd}/bnf/shared.js`));


	console.log("Automated Sample Tests");
	let failure = false;
	for (const lang of syntaxes) {
		console.log(" ", lang);
		const dir = `${cwd}/sample/${lang}`;
		if (!fs.existsSync(dir)) continue;

		let files = fs.readdirSync(dir);
		if (files.length === 0) continue;
		files = files.filter(x => x.endsWith(".txt"));

		const syntaxURL = pathToFileURL(`${cwd}/bnf/${lang}.js`);
		const Parser = await import(syntaxURL);

		if (!Parser.Parse_Program) {
			continue;
		}

		for (const file of files) {
			const data = fs.readFileSync(`${dir}/${file}`, "utf8");
			try {
				const syntax = Parser.Parse_Program(data, true);
				if (syntax instanceof Shared.ParseError) throw syntax;
				if (syntax.isPartial) throw new Shared.ParseError(
					"Partial Match",
					new Shared.ReferenceRange(syntax.root.ref.end, syntax.reach)
				).toString();;

				console.log(`    ${chalk.green("PASS")} ${file}`);
			} catch (e) {
				console.error(`    ${chalk.red("FAIL")} ${file}`);
				console.error(e);
				console.error("");
				failure = true;
			}
		}
	}

	if (failure) process.exit(1);
}





function ManualTests () {
	let tests = {
		// "Double Parse":     ['node double-parse.js',    { cwd }],
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
}


async function Main() {
	// // Symbolic link to actual bnf
	// const testBnfSyntax = "./test/bnf/bnf.bnf";
	// if (!fs.existsSync(testBnfSyntax)) {
	// 	fs.linkSync("./bnf/bnf.bnf", testBnfSyntax);
	// }

	// // Update sample since it's renamed
	// const testBnfSample = "./test/sample/bnf/self.txt";
	// if (fs.existsSync(testBnfSample)) {
	// 	fs.unlinkSync(testBnfSample);
	// }
	// fs.linkSync("./bnf/bnf.bnf", testBnfSample);

	CompileBNFs();
	await SampleTests();
	ManualTests();
}
Main();