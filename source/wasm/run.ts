type WasmParser = WebAssembly.Instance & {
	exports: {
		memory      : WebAssembly.Memory;
		input       : WebAssembly.Global;
		inputLength : WebAssembly.Global;
		heap        : WebAssembly.Global;

		_init: () => number;
		program: (index: number) => void;
	}
}


export async function Create(wasm: BufferSource){
	const bundle = await WebAssembly.instantiate(wasm, {
		js: {
			print_i32: console.log,
			print_i32_i32_i32: console.log
		}
	});
	return bundle.instance as WasmParser;
}

export function Parse(ctx: WasmParser, data: string, partial = false) {
	InjectString(ctx, data);

	const heap = ctx.exports._init();

	ctx.exports.program(0);

	return Decode(ctx, heap, partial);
}


function Decode(ctx: WasmParser, heap: number, partial: boolean) {
	const memory = ctx.exports.memory;
	const memoryArray = new Int32Array(memory.buffer);

	const offset = heap / 4;

	const start = memoryArray.at(offset+1);
	const end   = memoryArray.at(offset+2);

	if (!partial && end !== ctx.exports.inputLength.value) {
		console.error("Partial match");
	}

	console.log(`Start: ${start} End: ${end} Reached: ${Number(ctx.exports.reach)}`);
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