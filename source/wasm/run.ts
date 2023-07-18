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


type Cursor = {
	bytes: number,
	ref: Reference
};
// Cursor utilizes object parse by reference to reduce allocations
function ProgressCursor(str: string, bytes: number, cursorRef: Cursor) {
	const encoder = new TextEncoder();

	while(cursorRef.bytes <= bytes && cursorRef.ref.index < str.length) {
		const char = str[cursorRef.ref.index];
		const byteSize = encoder.encode(char).byteLength;

		if (cursorRef.bytes + byteSize > bytes) {
			break;
		}

		cursorRef.ref.advance(char === "\n");
		cursorRef.bytes += byteSize;
	}
}

function MapTreeRefs(tree: SyntaxNode, str: string, sharedRef: ReferenceRange) {
	let stack = [tree];

	let cursor: Cursor = {
		ref: Reference.blank(),
		bytes: 0
	};

	while (stack.length > 0) {
		const curr = stack.pop();
		if (!curr) continue;

		if (curr.ref === sharedRef) {
			// Don't calculate forward progression if not needed
			if (cursor.bytes !== curr.end) ProgressCursor(str, curr.end, cursor);

			curr.ref = new ReferenceRange(
				cursor.ref.clone(),
				cursor.ref // no alloc fill in
			);

			stack.push(curr); // revisit node for ref.end mapping (after children)
			if (typeof(curr.value) !== "string") {
				// Reverse order concat children to stack for FIFO
				for (let i=curr.value.length-1; i >= 0; i--) {
					stack.push(curr.value[i]);
				}
			}
		} else {
			// Don't calculate forward progression if not needed
			if (cursor.bytes !== curr.end) ProgressCursor(str, curr.end, cursor);

			curr.ref.end = cursor.ref.clone();
			curr.ref.end.advance(false); // end ref refers to the index after the final char
		}
	}
}

export function Parse(ctx: WasmParser, data: string, refMapping = true, entry = "program") {
	const heap = InitParse(ctx, data);

	const statusCode = (ctx.exports as any)[entry]() as number;
	let reach = Number(ctx.exports.reach);
	if (statusCode == 1) {
		if (refMapping) {
			const cursor = {bytes: 0, ref: Reference.blank()};
			ProgressCursor(data, reach, cursor);

			return new ParseError(
				"Unable to parse",
				new ReferenceRange(
					new Reference(0, 0, 0),
					cursor.ref
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

	const sharedRef = new ReferenceRange(
		new Reference(0,0,0),
		new Reference(0,0,0)
	);
	const root = Decode(ctx, heap, sharedRef);
	if (refMapping) {
		MapTreeRefs(root, data, sharedRef);
	};

	let reachRef: Reference | null = null;
	if (refMapping) {
		const cursor = {bytes: 0, ref: root.ref.end.clone()};
		ProgressCursor(data, reach, cursor);
		reachRef = cursor.ref;
	}

	return {
		reachBytes: reach,
		isPartial: root.end < ctx.exports.inputLength.value,
		reach: reachRef,
		root,
	};
}


function Decode(ctx: WasmParser, heap: number, sharedRef: ReferenceRange) {
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
			memoryArray.at(offset + OFFSET.COUNT/4) || 0,
			sharedRef
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
	return (
		`const OFFSET = ${JSON.stringify(OFFSET)};` +
		"\nexport "+InitParse.toString()+
		"\nexport "+ProgressCursor.toString()+
		"\nexport "+MapTreeRefs.toString()+
		"\nexport "+Parse.toString()+
		"\nexport "+Decode.toString()+"\n\n"
	).replace(/    /gm, "\t").replace(/\r\n/gm, "\n");
}