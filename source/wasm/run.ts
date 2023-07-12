import { ParseError, Reference, ReferenceRange, SyntaxNode } from "../artifacts/shared.js";
import { OFFSET } from "./layout.js";


export type WasmParser = WebAssembly.Instance & {
	exports: {
		memory      : WebAssembly.Memory;
		input       : WebAssembly.Global;
		inputLength : WebAssembly.Global;
		heap        : WebAssembly.Global;

		_init: () => number;
		program: () => number;
	}
}


export function Create(wasm: BufferSource){
	const mod = new WebAssembly.Module(wasm);
	const bundle = new WebAssembly.Instance(mod, {
		js: {
			print_i32: console.log
		}
	} as any);
	return bundle as WasmParser;
}

function InitParse(ctx: WasmParser, data: string) {
	const memory = ctx.exports.memory;
	memory.grow(1); // grow memory if needed

	// Convert the string to UTF-8 bytes
	const utf8Encoder = new TextEncoder();
	const stringBytes = utf8Encoder.encode(data);

	// Copy the string bytes to WebAssembly memory
	const wasmMemory = new Uint8Array(memory.buffer);
	wasmMemory.set(stringBytes, ctx.exports.input.value);

	ctx.exports.inputLength.value = stringBytes.byteLength;

	return ctx.exports._init();
}

function MapBytes2String(str: string, bytes: number, byteOffset: number = 0, ref: Reference) {
	const encoder = new TextEncoder();

	// const ref = from.clone();

	while(byteOffset <= bytes && ref.index < str.length) {
		const char = str[ref.index];
		const byteSize = encoder.encode(char).byteLength;

		if (byteOffset + byteSize > bytes) {
			break;
		}

		ref.advance(char === "\n");
		byteOffset += byteSize;
	}

	return {
		bytes: byteOffset,
		ref: ref
	};
}

function MapTreeRefs(tree: SyntaxNode, str: string) {
	let stack  = [tree];
	let byteOffset = 0;

	let overlap = {
		ref: new Reference(1,1,0),
		bytes: 0
	};

	while (stack.length > 0) {
		const curr = stack.pop();
		if (!curr) continue;

		if (!curr.ref) {
			overlap = overlap.bytes === curr.start ? overlap :
				MapBytes2String(str, curr.start, byteOffset, overlap.ref);
			curr.ref = new ReferenceRange(
				overlap.ref.clone(),
				new Reference(0,0,0)
			);
			byteOffset = overlap.bytes;

			if (typeof(curr.value) === "string") {
				stack.push(curr);
			} else {
				stack = stack.concat([ curr, ...[...curr.value].reverse()]);
			}
		} else {
			overlap = overlap.bytes === curr.end ? overlap :
				MapBytes2String(str, curr.end, byteOffset, overlap.ref);
			curr.ref.end = overlap.ref.clone();
			curr.ref.end.advance(false);
			byteOffset = overlap.bytes;
		}
	}
}

export function Parse(ctx: WasmParser, data: string, refMapping = true, entry = "program") {
	const heap = InitParse(ctx, data);

	const statusCode = (ctx.exports as any)[entry]() as number;
	let reach = Number(ctx.exports.reach);
	if (statusCode == 1) {
		if (refMapping) {
			return new ParseError(
				"Unable to parse",
				new ReferenceRange(
					new Reference(0, 0, 0),
					MapBytes2String(data, reach, 0, new Reference(1,1,0)).ref
				)
			)
		} else {
			return new ParseError(
				"Unable to parse",
				new ReferenceRange(
					new Reference(0, 0, 0),
					new Reference(0, 0, reach)
				)
			)
		}
	};

	const root = Decode(ctx, heap, refMapping);
	if (refMapping) {
		MapTreeRefs(root, data);
	};

	return {
		root,
		reachBytes: reach,
		isPartial: root.end < ctx.exports.inputLength.value
	};
}


function Decode(ctx: WasmParser, heap: number, readBoundary = false) {
	const memory = ctx.exports.memory;
	const memoryArray = new Int32Array(memory.buffer);
	const byteArray   = new Int8Array(memory.buffer);

	const decoder = new TextDecoder();

	const stack: SyntaxNode[] = [];
	let root: null | SyntaxNode = null;
	let offset = (heap / 4);

	const typeCache = new Map<number, string>();

	while (root === null || stack.length > 0) {
		const curr = stack[stack.length-1];

		// Has current stack element been satisfied?
		if (curr && curr.count == curr.value.length) {
			stack.pop();
			continue;
		}

		const type_ptr = memoryArray.at(offset + OFFSET.TYPE    /4) || 0;
		let type = typeCache.get(type_ptr);;
		if (!type) {
			const type_len = memoryArray.at(offset + OFFSET.TYPE_LEN/4) || 0;
			type = decoder.decode(byteArray.slice(type_ptr, type_ptr+type_len));

			typeCache.set(type_ptr, type);
		}

		const next = new SyntaxNode(
			type,
			memoryArray.at(offset + OFFSET.START/4) || 0,
			memoryArray.at(offset + OFFSET.END/4)   || 0,
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


export function toString() {
	return `import "./shared.js";\n` +
		`const OFFSET = ${JSON.stringify(OFFSET)};` +
		"\nexport "+InitParse.toString()+
		"\nexport "+MapBytes2String.toString()+
		"\nexport "+MapTreeRefs.toString()+
		"\nexport "+Parse.toString()+
		"\nexport "+Decode.toString()+"\n\n";
}