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
const isCommonJS = process.argv.includes("--commonjs");

function GenerateRunner(lang: legacy.Parser, wasm: Uint8Array) {
	let out = 'import * as _Shared from "./shared.js";\n' +
		`const _ctx = new WebAssembly.Instance(\n` +
		`  new WebAssembly.Module(\n` +
		`    _Shared.DecodeBase64("${Buffer.from(wasm).toString('base64')}")\n`+
		`  ),\n` +
		`  {js: {print_i32: console.log}}\n`+
		`);\n`;

	for (const [name, rule] of lang.terms) {
		out += `export function ${rule.name} (data, refMapping = true) {\n`;
		out += `  return _Shared.Parse(_ctx, data, refMapping, "${name}");\n`;
		out += `}\n`;
	}

	return out;
}


const root = process.argv[2] || "./";
const root_dir = dirname(root);

if (!existsSync(root)) {
	console.error(`Unknown path ${root}`);
	process.exit(1);
}

const files = (
	statSync(root).isFile() ?
		[root] :
		readdirSync(root)
			.map(file => `${root}/${file}`)
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
	const syntax = bnf.program(data);
	if (syntax instanceof _Shared.ParseError) {
		console.error(`Failed to parse ${name}`);
		console.error(syntax.toString());
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