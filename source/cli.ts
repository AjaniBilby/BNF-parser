#!/usr/bin/env node
"use strict";

import { readdirSync, existsSync, readFileSync, writeFileSync, appendFileSync } from "fs";
import { basename, extname, join } from "path";
import { legacy, wasm } from "./index.js";


const dirname = join(process.argv[1], "../");

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

if (!existsSync(root)) {
	console.error(`Unknown path ${root}`);
	process.exit(1);
}

const files = readdirSync(root)
	.filter(x => extname(x) === ".bnf");

if (files.length === 0) {
	console.error(`No BNF files found in ${root}`);
	process.exit(1);
}

console.log(`Found: ${files.join(', ')}`)

let failure = false;
for (const file of files) {
	const name = basename(file, '.bnf');
	const data = readFileSync(`${root}/${file}`, 'utf8');

	// Ingest input BNF
	const syntax = legacy.BNF.parse(data);
	if (syntax instanceof legacy.ParseError) {
		console.error(`Failed to parse ${file}`);
		console.error(syntax.toString());
		console.error("");
		failure = true;
		continue;
	}
	const lang = legacy.Compile(syntax);
	if (syntax instanceof legacy.ParseError) {
		console.error(`Compile ${file} syntax into graph`);
		console.error(syntax.toString());
		console.error("");
		failure = true;
		continue;
	}

	// Generate type headers
	const types = wasm.CompileTypes(lang);
	writeFileSync(`${root}/${name}.d.ts`, types);

	// Generate web assembly
	try {
		const module = wasm.GenerateWasm(lang);
		if (process.argv.includes("--emit-wat"))
			writeFileSync(`${root}/${name}.wat`, module.emitText());

		// Generate JS runner
		writeFileSync(`${root}/${name}.js`,
			GenerateRunner(lang, module.emitBinary())
		);
	} catch (e) {
		console.error(`Error while compiling ${file} to wasm`);
		console.error(e);
		failure = true;
	}

	console.log(`  - Compiled: ${file}`);
}

writeFileSync(`${root}/shared.js`, wasm.Runner.toString());
writeFileSync(`${root}/shared.d.ts`, readFileSync(`${dirname}/artifacts/shared.d.ts`, "utf8"));
appendFileSync(`${root}/shared.js`, readFileSync(`${dirname}/artifacts/shared.js`, "utf8"));

if (failure) process.exit(1);