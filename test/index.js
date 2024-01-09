import path from "node:path";
import chalk from "chalk";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { execSync } from "node:child_process";
import { readFile } from "node:fs/promises";

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




async function TestSyntaxes() {
	const syntaxes = fs.readdirSync(`${cwd}/bnf`)
		.filter(x => x.endsWith(".bnf"))
		.map(x => x.slice(0, -4));

	const Shared = await import(pathToFileURL(`${cwd}/bnf/shared.js`));

	console.log("Automated Sample Tests");
	const results = await Promise.all(syntaxes.map(l => TestSyntax(l, Shared)))
	if (results.some(x => x === false)) process.exit(1);
}

async function TestSyntax(lang, Shared) {
	let log = ' ' + lang;

	// See if a folder exists with samples
	const dir = `${cwd}/sample/${lang}`;
	if (!fs.existsSync(dir)) return true;

	let files = fs.readdirSync(dir)
		.filter(x => x.endsWith(".txt"));

	// Don't bother loading the parser if there are no files to parse
	if (files.length === 0) return true;

	const syntaxURL = pathToFileURL(`${cwd}/bnf/${lang}.js`);
	const Parser = await import(syntaxURL);
	if (!Parser.Parse_Program) return false;
	await Parser?.ready;

	let failed = false;
	for (const file of files) {
		const data = await readFile(`${dir}/${file}`, "utf8");

		try {
			const syntax = Parser.Parse_Program(data, true);
			if (syntax instanceof Shared.ParseError) throw syntax;
			if (syntax.isPartial) throw new Shared.ParseError(
				"Partial Match",
				new Shared.ReferenceRange(syntax.root.ref.end, syntax.reach)
			).toString();

			log += `\n    ${chalk.green("PASS")} ${file}`;
		} catch (e) {
			log += `\n    ${chalk.red("FAIL")} ${file}`;
			log += `\n${e}\n`;
			failed = true;
		}
	}

	if (failed) {
		console.error(log);
	} else {
		console.log(log);
	}

	return failed;
}


async function Main() {
	// Symbolic link to actual bnf
	const testBnfSyntax = "./test/bnf/bnf.bnf";
	if (!fs.existsSync(testBnfSyntax)) {
		fs.linkSync("./bnf/bnf.bnf", testBnfSyntax);
	}

	// Update sample since it's renamed
	const testBnfSample = "./test/sample/bnf/self.txt";
	if (fs.existsSync(testBnfSample)) {
		fs.unlinkSync(testBnfSample);
	}
	fs.linkSync("./bnf/bnf.bnf", testBnfSample);

	CompileBNFs();
	await TestSyntaxes();
}
Main();