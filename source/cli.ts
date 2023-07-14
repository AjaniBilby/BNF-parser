#!/usr/bin/env node
"use strict";

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
let ready = new Promise(async (res, rej) => {
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
export { ready };`;

	for (const [name, rule] of lang.terms) {
		out += `export function Parse_${rule.name[0].toUpperCase()}${rule.name.slice(1)} (data, refMapping = true) {\n`;
		out += `  return _Shared.Parse(_ctx, data, refMapping, "${name}");\n`;
		out += `}\n`;
	}

	return out;
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

console.log(`Found: ${files.join(', ')}`)

let failure = false;
for (const file of files) {
	const name = basename(file, '.bnf');
	const data = readFileSync(file, 'utf8');

	// Ingest input BNF
	const syntax = bnf.Parse_Program(data);
	if (syntax instanceof _Shared.ParseError) {
		console.error(`Failed to parse ${name}`);
		console.error(syntax.toString());
		console.error("");
		failure = true;
		continue;
	}
	if (syntax.isPartial) {
		console.error(`Failed to finish parsing ${name}`);
		console.error(syntax.reach?.toString());
		console.error("");
		failure = true;
		continue;
	}


	let lang: null | legacy.Parser = null;
	try {
		lang = CompileProgram(syntax.root)
	} catch(e) {
		if (e instanceof ParseError) {
			console.error(e.toString());
		} else {
			console.error(e);
		}

		process.exit(1);
	}
	if (syntax instanceof legacy.ParseError) {
		console.error(`Compile ${file} syntax into graph`);
		console.error(syntax.toString());
		console.error("");
		failure = true;
		continue;
	}

	// Generate type headers
	const types = wasm.CompileTypes(lang);
	writeFileSync(`${root_dir}/${name}.d.ts`, types);

	// Generate web assembly
	try {
		const module = wasm.GenerateWasm(lang);
		if (process.argv.includes("--emit-wat"))
			writeFileSync(`${root_dir}/${name}.wat`, module.emitText());

		// Generate JS runner
		writeFileSync(`${root_dir}/${name}.js`,
			GenerateRunner(lang, module.emitBinary())
		);
	} catch (e) {
		console.error(`Error while compiling ${file} to wasm`);
		console.error(e);
		failure = true;
	}

	console.log(`  - Compiled: ${file}`);
}

writeFileSync(`${root_dir}/shared.js`, wasm.Runner.toString());
writeFileSync(`${root_dir}/shared.d.ts`, readFileSync(`${script}/artifacts/shared.d.ts`, "utf8"));
appendFileSync(`${root_dir}/shared.js`, readFileSync(`${script}/artifacts/shared.js`, "utf8"));

if (failure) process.exit(1);