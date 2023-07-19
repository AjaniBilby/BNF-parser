import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";
import chalk from "chalk";
import fs from "node:fs";

import * as Shared from "./bnfs/shared.js";

const cwd = path.dirname(process.argv[1]);



function CompileBNFs(){
	console.log("Compiling BNFs");
	try {
		execSync("node ../bin/cli.js ./bnfs/", { cwd })
	} catch (e) {
		console.error(e.stderr);
		console.error("Failed to compile BNFs");
		process.exit(1);
	}
}




async function SampleTests() {
	const syntaxes = fs.readdirSync(`${cwd}/bnfs`)
		.filter(x => x.endsWith(".bnf"))
		.map(x => x.slice(0, -4));


	console.log("Automated Sample Tests");
	let failure = false;
	for (const lang of syntaxes) {
		console.log(" ", lang);
		const dir = `${cwd}/samples/${lang}`;
		if (!fs.existsSync(dir)) continue;

		const files = fs.readdirSync(dir);
		if (files.length === 0) continue;

		const syntaxURL = pathToFileURL(`${cwd}/bnfs/${lang}.js`);
		const Parser = await import(syntaxURL);

		if (!Parser.Parse_Program) {
			continue;
		}

		for (const file of files) {
			const data = fs.readFileSync(`${dir}/${file}`, "utf8");
			try {
				const syntax = Parser.Parse_Program(data, false);
				if (syntax instanceof Shared.ParseError) throw syntax;
				if (syntax.isPartial) throw new Error("Partial Match");

				console.log(`    ${chalk.green("PASS")} ${file}`);
			} catch (e) {
				console.log(`    ${chalk.red("FAIL")} ${file}`);
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
	CompileBNFs();
	await SampleTests();
	ManualTests();
}
Main();