import { readFileSync, writeFileSync } from "fs";
import * as path from "path";


type WasmParser = WebAssembly.Instance & {
	exports: {
		memory      : WebAssembly.Memory;
		inputLength : WebAssembly.Global;
		heap        : WebAssembly.Global;

		add: (a: number, b: number) => number;
		parse: (index: number) => void;
	}
}


async function Init(wasm: BufferSource){
	const bundle = await WebAssembly.instantiate(wasm);
	return bundle.instance as WasmParser;
}

function Parse(ctx: WasmParser, data: string) {
	InjectString(ctx, data);

	ctx.exports.parse(0);

	return Decode(ctx);
}


function Decode(ctx: WasmParser) {
	const memory = ctx.exports.memory;
	const memoryArray = new Int32Array(memory.buffer);

	const address = ctx.exports.inputLength.value;
	const value = memoryArray[address / Int32Array.BYTES_PER_ELEMENT];
	console.log(`"b" at index ${value}`);
}



function InjectString(ctx: WasmParser, data: string) {
	const memory = ctx.exports.memory;

	// Convert the string to UTF-8 bytes
	const utf8Encoder = new TextEncoder();
	const stringBytes = utf8Encoder.encode(data);

	// Allocate space in the WebAssembly memory for the string
	const newMemory = new Uint8Array(memory.buffer.byteLength + stringBytes.byteLength * 20);
	newMemory.set(new Uint8Array(memory.buffer));
	memory.grow(1); // grow memory if needed

	// Copy the string bytes to WebAssembly memory
	const wasmMemory = new Uint8Array(memory.buffer);
	wasmMemory.set(stringBytes, 0);

	ctx.exports.inputLength.value = stringBytes.byteLength;
}

async function Test(){
	const sample = await Init(
		readFileSync(path.join(__dirname, "./sample.wasm"))
	);

	Parse(sample, "Hello, Web Assembly!");
}

Test();