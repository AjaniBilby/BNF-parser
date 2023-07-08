import { ParseError, Reference, ReferenceRange } from "../syntax.js";
import { OFFSET } from "./layout.js";

type WasmParser = WebAssembly.Instance & {
	exports: {
		memory      : WebAssembly.Memory;
		input       : WebAssembly.Global;
		inputLength : WebAssembly.Global;
		heap        : WebAssembly.Global;

		_init: () => number;
		program: () => number;
	}
}


export class Wasm_SyntaxNode {
	type : string;
	start: number;
	end  : number;
	count: number;

	value: Wasm_SyntaxNode[] | string;

	constructor (type: string, start: number, end: number, count: number) {
		this.type  = type;
		this.start = start;
		this.end   = end;
		this.count = count;
		this.value = [];
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

export function Parse(ctx: WasmParser, data: string, refMapping = false) {
	InjectString(ctx, data);

	const heap = ctx.exports._init();

	const statusCode = ctx.exports.program();
	const reach = Number(ctx.exports.reach);
	if (statusCode == 1) return new ParseError(
		"Unable to parse",
		new ReferenceRange(
			new Reference(0, 0, 0),
			new Reference(0, 0, reach)
		)
	);

	const root = Decode(ctx, heap);

	console.log(`Start: ${root.start} End: ${root.end} Reached: ${Number(ctx.exports.reach)}`);

	return { root, reach };
}


function Decode(ctx: WasmParser, heap: number) {
	const memory = ctx.exports.memory;
	const memoryArray = new Int32Array(memory.buffer);
	const byteArray   = new Int8Array(memory.buffer);

	const decoder = new TextDecoder('ascii');



	const stack: Wasm_SyntaxNode[] = [];
	let root: null | Wasm_SyntaxNode = null;
	let offset = (heap / 4);

	while (root === null || stack.length > 0) {
		const curr = stack[stack.length-1];

		// Has current stack element been satisfied?
		if (curr && curr.count == curr.value.length) {
			stack.pop();
			continue;
		}

		const type_ptr = memoryArray.at(offset + OFFSET.TYPE    /4) || 0;
		const type_len = memoryArray.at(offset + OFFSET.TYPE_LEN/4) || 0;

		const next = new Wasm_SyntaxNode(
			decoder.decode(byteArray.slice(type_ptr, type_ptr+type_len)),
			memoryArray.at(offset + OFFSET.START/4) || 0,
			memoryArray.at(offset + OFFSET.END  /4) || 0,
			memoryArray.at(offset + OFFSET.COUNT/4) || 0
		);
		offset += OFFSET.DATA/4;

		// Add child to current top of stack
		//  or make it the root
		if (curr) {
			if (typeof(curr.value) === "string") throw new Error("Attempting to add a syntax child to a string");
			curr.value.push(next);
		} else {
			root = next;
		}

		// Attempt to satisfy the child
		if (next.type === "literal") {
			const data_ptr = offset*4; // offset already pushed to data
			const segment  = byteArray.slice(data_ptr, data_ptr+next.count);
			next.value = decoder.decode(segment);
			offset += Math.ceil(next.count/4);
		} else {
			stack.push(next);
		}
	}

	if (!root) throw new Error("How?");

	return root;
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