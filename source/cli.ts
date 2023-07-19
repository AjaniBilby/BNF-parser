#!/usr/bin/env node
"use strict";

import chalk from 'chalk';

import { readdirSync, existsSync, readFileSync, writeFileSync, appendFileSync, statSync } from "fs";
import { basename, extname, join, dirname } from "path";
import { legacy, wasm } from "./index.js";

import { ParseError } from "./artifacts/shared.js";
import { CompileProgram } from "./compile.js";

import * as _Shared from "../dist/shared.js"; // things shared between multiple pre-compiled BNFs
import * as bnf from "../dist/bnf.js";       // pre-compiled JS with WASM embedded


const script = join(process.argv[1], "../");

function GenerateRunner(lang: legacy.Parser, wasm: Uint8Array) {
	let out =
`import * as _Shared from "./shared.js";
let _rawWasm = _Shared.DecodeBase64("${Buffer.from(wasm).toString('base64')}");
let _ctx = null;
if (typeof window === 'undefined') {
	_ctx = new WebAssembly.Instance(
		new WebAssembly.Module(
			_rawWasm
		), {js: {print_i32: console.log}}
	);
}
let ready = new Promise(async (res) => {
	if (typeof window !== 'undefined') {
		_ctx = await WebAssembly.instantiate(
			await WebAssembly.compile(_rawWasm),
			{js: {print_i32: console.log}}
		);
	}

	Object.freeze(_ctx);
	_rawWasm = null;
	res();
});
export { ready };\n`;

	for (const [name, rule] of lang.terms) {
		out += `export function Parse_${rule.name[0].toUpperCase()}${rule.name.slice(1)} (data, refMapping = true) {\n`;
		out += `\treturn _Shared.Parse(_ctx, data, refMapping, "${name}");\n`;
		out += `}\n`;
	}

	return out;
}


function ColorizeError(msg: string) {
	let index = msg.indexOf(":");
	if (index === -1) index = 0;

	return chalk.red(msg.slice(0, index)) + msg.slice(index);
}


const root = process.argv[2] || "./";
const isFile = statSync(root).isFile();
const root_dir = isFile ? dirname(root) : root.slice(0, -1);

if (!existsSync(root)) {
	console.error(`Unknown path ${root}`);
	process.exit(1);
}

const files = (
	isFile ?
		[root] :
		readdirSync(root)
			.map(file => `${root}${file}`)
	).filter(x => extname(x) === ".bnf");

if (files.length === 0) {
	console.error(`No BNF files found in ${root}`);
	process.exit(1);
}

console.log(`Found: ${files.join(', ')}\n`);

let failure = false;
for (const file of files) {
	const name = basename(file, '.bnf');
	const data = readFileSync(file, 'utf8');

	console.log(` - Compiling ${chalk.cyan(name)}`)

	// Ingest input BNF
	let syntax: ReturnType<typeof bnf.Parse_Program> ;
	try {
		syntax = bnf.Parse_Program(data);
	} catch (e: any) {
		console.error(`   Parsing...`);
		console.error(`   ${ColorizeError(e.toString())}`);
		console.error("");
		failure = true;
		continue;
	}
	if (syntax instanceof _Shared.ParseError) {
		console.error(`   Parsing...`);
		console.error(`   ${ColorizeError(syntax.toString())}`)
		console.error("");
		failure = true;
		continue;
	}
	if (syntax.isPartial) {
		console.error(`   Parsing...`);
		console.error(`   ${chalk.red("Failed")} to finish parsing at ${syntax.root.ref.end.toString()} reached ${syntax.reach?.toString()}`);
		console.error("");
		failure = true;
		continue;
	}



	let lang: null | legacy.Parser = null;
	try {
		lang = CompileProgram(syntax.root);
	} catch(e: any) {
		console.error(`   Encoding Parser`);
		console.error(ColorizeError(e.toString()));
		process.exit(1);
	}

	// Generate type headers
	const types = wasm.CompileTypes(lang);
	writeFileSync(`${root_dir}/${name}.d.ts`, types);

	// Generate web assembly
	try {
		const module = wasm.GenerateWasm(lang);
		if (process.argv.includes("--emit-wat"))
			writeFileSync(`${root_dir}/${name}.wat`, module.emitText());

		module.optimize();

		// Generate JS runner
		writeFileSync(`${root_dir}/${name}.js`,
			GenerateRunner(lang, module.emitBinary())
		);
	} catch (e: any) {
		console.error(`   Compiling WASM...`);
		console.error(`   ${ColorizeError(e.toString())}`);
		console.error("");
		failure = true;
	}

	console.log(`  - ${chalk.green("OK")}: ${file}`);
}

writeFileSync(`${root_dir}/shared.js`, wasm.Runner.toString());
writeFileSync(
	`${root_dir}/shared.d.ts`,
	readFileSync(`${script}/artifacts/shared.d.ts`, "utf8")
		.replace(/    /gm, "\t")
		.replace(/\r\n/g, "\n")
);
appendFileSync(
	`${root_dir}/shared.js`,
	readFileSync(`${script}/artifacts/shared.js`, "utf8")
		.replace(/    /gm, "\t")
		.replace(/\r\n/g, "\n")
);

if (failure) process.exit(1);