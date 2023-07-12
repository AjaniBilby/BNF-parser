import * as path from "path";
import * as fs from "fs";
import * as bnf from "../bin/index.js";

console.log("First Parse:");

const cwd = path.dirname(process.argv[1]);

let data = fs.readFileSync(path.join(cwd, '../bnf/bnf.bnf'), 'utf8');
console.log("Compiling to wasm");
const module = bnf.wasm.Compile2Wasm(data);
if (module.msg) {
	console.error(`Failed to parse`);
	console.error(module.toString());
	process.exit(1);
}

let wasm;
console.log("Generating binary");
try {
	wasm = module.emitBinary();
} catch (e) {
	console.error(e);
	process.exit(1);
}

console.log("Parsing with binary");
const parser = bnf.wasm.Runner.Create(wasm);
const final = bnf.wasm.Runner.Parse(parser, data, false, "program");

if (final.msg) {
	console.error("Failed to parse");
	console.error(final.toString());
	process.exit(1);
}

if (final.isPartial) {
	console.error("Only partial parse");
	console.error(final);
	process.exit(1);
}

console.log("Finished");