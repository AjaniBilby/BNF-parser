import { readFileSync } from "fs";
import * as path from "path";


type WasmParser = WebAssembly.Instance & {
	exports: {
		memory      : WebAssembly.Memory;
		input       : WebAssembly.Global;
		inputLength : WebAssembly.Global;

		_init: () => number;
		program: (index: number) => void;
	}
}


async function Init(wasm: BufferSource){
	const bundle = await WebAssembly.instantiate(wasm, {
		js: {
			print_i32: console.log,
			print_i32_i32_i32: console.log
		}
	});
	return bundle.instance as WasmParser;
}

function Parse(ctx: WasmParser, data: string, entry?: string) {
	InjectString(ctx, data);

	const heap = ctx.exports._init();
	console.log("init");

	const startIndex = ctx.exports.input.value;

	if (entry) {
		const funcs = ctx.exports as any;
		if (typeof(funcs[entry]) !== "function") throw new Error(`Unknown entry point ${entry}`);

		funcs[entry](startIndex);
	} else {
		ctx.exports.program(startIndex);
	}

	return Decode(ctx, heap);
}


function Decode(ctx: WasmParser, heap: number) {
	const memory = ctx.exports.memory;
	const memoryArray = new Int32Array(memory.buffer);

	const value = memoryArray[Math.ceil(heap / Int32Array.BYTES_PER_ELEMENT)];
	console.log(`"b" at index ${value}`);
}



function InjectString(ctx: WasmParser, data: string) {
	const memory = ctx.exports.memory;
	memory.grow(1); // grow memory if needed

	// Convert the string to UTF-8 bytes
	const utf8Encoder = new TextEncoder();
	const stringBytes = utf8Encoder.encode(data);

	// Copy the string bytes to WebAssembly memory
	const wasmMemory = new Uint8Array(memory.buffer);
	wasmMemory.set(stringBytes, ctx.exports.input.value);

	ctx.exports.inputLength.value = stringBytes.byteLength;
}

async function Test(){
	const sample = await Init(
		readFileSync("../out.wasm")
	);

	Parse(sample, "Hello, Web Assembly!");
}

Test();