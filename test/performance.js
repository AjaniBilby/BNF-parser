import { performance, PerformanceObserver } from "node:perf_hooks";
import path from "node:path";
import { readFileSync } from "node:fs";

import { bnf, legacy } from "../bin/index.js";


const cwd = path.dirname(process.argv[1]);

const samples = [
	readFileSync(`${cwd}/bnf/lolcode.bnf`, 'utf8'),
	readFileSync(`${cwd}/bnf/sequalize.bnf`, 'utf8')
];


const durations = {
	wasm: [],
	wasmFast: [],
	legacy: [],

	encode:  [],
	parse:   [],
	decode:  [],
	mapping: [],
};


for (let i=0; i<10000; i++) {
	for (const data of samples) {
		performance.mark("wasm-start");
		bnf.Parse_Program(data, true);
		performance.mark("wasm-end");
		durations.wasm.push(performance.measure("wasm-parse", "wasm-start", "wasm-end").duration);
		// durations.encode.push (performance.measure("wasm-encode", "wasm-encode",  "wasm-parse").duration);
		// durations.parse.push  (performance.measure("wasm-parse", "wasm-parse",   "wasm-decode").duration);
		// durations.decode.push (performance.measure("wasm-decode", "wasm-decode",  "wasm-mapping").duration);
		// durations.mapping.push(performance.measure("wasm-mapping", "wasm-mapping", "wasm-finish").duration);

		performance.mark("wasmFast-start");
		bnf.Parse_Program(data, false);
		performance.mark("wasmFast-end");
		durations.wasmFast.push(performance.measure("wasm-parse-nomap", "wasmFast-start", "wasmFast-end").duration);

		performance.mark("legacy-start");
		legacy.BNF.parse(data, false, "program");
		performance.mark("legacy-end");
		durations.legacy.push(performance.measure("legacy", "legacy-start", "legacy-end").duration);
	}
}


for (const key in durations) {
	durations[key].sort((a, b) => a - b);
}


function getPercentile(sortedArr, percentile) {
	var index = percentile * sortedArr.length;
	var result;

	if (Math.floor(index) === index) {
			result = (sortedArr[(index - 1)] + sortedArr[index]) / 2;
	} else {
			result = sortedArr[Math.floor(index)];
	}

	return result;
}

function getMean(arr) {
	return arr.reduce((x, s) => x + s, 0) / arr.length;
}


function displayStatus(sortedArr) {
	console.log(`  max: ${sortedArr[sortedArr.length-1].toFixed(4).padStart(8, " ")}ms`);
	console.log(`  99%: ${getPercentile(sortedArr, 0.99).toFixed(4).padStart(8, " ")}ms`);
	console.log(`  50%: ${getPercentile(sortedArr, 0.5).toFixed(4).padStart(8, " ")}ms`);
	console.log(`   1%: ${getPercentile(sortedArr, 0.1).toFixed(4).padStart(8, " ")}ms`);
	console.log(`  min: ${sortedArr[0].toFixed(4).padStart(8, " ")}ms`);
	console.log(` mean: ${getMean(sortedArr).toFixed(4).padStart(2).padStart(8, " ")}ms`);
}

// console.log("Wasm Encode");
// displayStatus(durations.encode);
// console.log("");
// console.log("Wasm Parse");
// displayStatus(durations.parse);
// console.log("");
// console.log("Wasm Decode");
// displayStatus(durations.decode);
// console.log("");
// console.log("Wasm Mapping");
// displayStatus(durations.mapping);
// console.log("");
// console.log("");

console.log("Wasm");
displayStatus(durations.wasm);
console.log("");
console.log("Wasm (no source map)");
displayStatus(durations.wasmFast);
console.log("");
console.log("Legacy");
displayStatus(durations.legacy);