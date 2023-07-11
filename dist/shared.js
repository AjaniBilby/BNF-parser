import "./shared.js";
const OFFSET = {"TYPE":0,"TYPE_LEN":4,"START":8,"END":12,"COUNT":16,"DATA":20};
export function InitParse(ctx, data) {
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
export function MapBytes2String(str, bytes, byteOffset = 0, ref) {
    const encoder = new TextEncoder();
    // const ref = from.clone();
    while (byteOffset <= bytes && ref.index < str.length) {
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
export function MapTreeRefs(tree, str) {
    let stack = [tree];
    let byteOffset = 0;
    let overlap = {
        ref: new Reference(1, 1, 0),
        bytes: 0
    };
    while (stack.length > 0) {
        const curr = stack.pop();
        if (!curr)
            continue;
        if (!curr.ref) {
            overlap = overlap.bytes === curr.start ? overlap :
                MapBytes2String(str, curr.start, byteOffset, overlap.ref);
            curr.ref = new ReferenceRange(overlap.ref.clone(), new Reference(0, 0, 0));
            byteOffset = overlap.bytes;
            if (typeof (curr.value) === "string") {
                stack.push(curr);
            }
            else {
                stack = stack.concat([curr, ...[...curr.value].reverse()]);
            }
        }
        else {
            overlap = overlap.bytes === curr.end ? overlap :
                MapBytes2String(str, curr.end, byteOffset, overlap.ref);
            curr.ref.end = overlap.ref.clone();
            curr.ref.end.advance(false);
            byteOffset = overlap.bytes;
        }
    }
}
export function Parse(ctx, data, refMapping = true, entry = "program") {
    const heap = InitParse(ctx, data);
    const statusCode = ctx.exports[entry]();
    let reach = Number(ctx.exports.reach);
    if (statusCode == 1) {
        if (refMapping) {
            return new ParseError("Unable to parse", new ReferenceRange(new Reference(0, 0, 0), MapBytes2String(data, reach, 0, new Reference(1, 1, 0)).ref));
        }
        else {
            return new ParseError("Unable to parse", new ReferenceRange(new Reference(0, 0, 0), new Reference(0, 0, reach)));
        }
    }
    ;
    const root = Decode(ctx, heap, refMapping);
    if (refMapping) {
        MapTreeRefs(root, data);
    }
    ;
    return {
        root,
        reachBytes: reach,
        inputBytes: ctx.exports.inputLength.value
    };
}
export function Decode(ctx, heap, readBoundary = false) {
    const memory = ctx.exports.memory;
    const memoryArray = new Int32Array(memory.buffer);
    const byteArray = new Int8Array(memory.buffer);
    const decoder = new TextDecoder();
    const stack = [];
    let root = null;
    let offset = (heap / 4);
    const typeCache = new Map();
    while (root === null || stack.length > 0) {
        const curr = stack[stack.length - 1];
        // Has current stack element been satisfied?
        if (curr && curr.count == curr.value.length) {
            stack.pop();
            continue;
        }
        const type_ptr = memoryArray.at(offset + OFFSET.TYPE / 4) || 0;
        let type = typeCache.get(type_ptr);
        ;
        if (!type) {
            const type_len = memoryArray.at(offset + OFFSET.TYPE_LEN / 4) || 0;
            type = decoder.decode(byteArray.slice(type_ptr, type_ptr + type_len));
            typeCache.set(type_ptr, type);
        }
        const next = new SyntaxNode(type, readBoundary ? memoryArray.at(offset + OFFSET.START / 4) || 0 : -1, readBoundary ? memoryArray.at(offset + OFFSET.END / 4) || 0 : -1, memoryArray.at(offset + OFFSET.COUNT / 4) || 0);
        offset += OFFSET.DATA / 4;
        // Add child to current top of stack
        //  or make it the root
        if (curr) {
            if (typeof (curr.value) === "string")
                throw new Error("Attempting to add a syntax child to a string");
            curr.value.push(next);
        }
        else {
            root = next;
        }
        // Attempt to satisfy the child
        if (next.type === "literal") {
            const data_ptr = offset * 4; // offset already pushed to data
            const segment = byteArray.slice(data_ptr, data_ptr + next.count);
            next.value = decoder.decode(segment);
            offset += Math.ceil(next.count / 4);
        }
        else {
            stack.push(next);
        }
    }
    if (!root)
        throw new Error("How?");
    return root;
}

export class ParseError {
    constructor(msg, ref) {
        this.stack = [];
        this.msg = msg;
        this.ref = ref;
    }
    add_stack(elm) {
        this.stack.unshift(elm);
    }
    hasStack() {
        return this.stack.length > 0;
    }
    toString() {
        return `Parse Error: ${this.msg} ${this.ref.toString()}` +
            (this.hasStack() ? "\nstack: " + this.stack.join(" -> ") : "");
    }
}
export class SyntaxNode {
    constructor(type, start, end, count) {
        this.type = type;
        this.start = start;
        this.end = end;
        this.count = count;
        this.value = [];
        this.ref = null;
    }
}
export class Reference {
    constructor(line, col, index) {
        this.line = line;
        this.col = col;
        this.index = index;
    }
    advance(newline = false) {
        if (newline) {
            this.col = 1;
            this.line++;
            this.index++;
        }
        else {
            this.index++;
            this.col++;
        }
    }
    valueOf() {
        return this.index;
    }
    clone() {
        return new Reference(this.line, this.col, this.index);
    }
    toString() {
        return `(${this.line}:${this.col})`;
    }
}
export class ReferenceRange {
    constructor(from, to) {
        this.start = from;
        this.end = to;
    }
    span(other) {
        if (other.start.index < this.start.index) {
            this.start = other.start;
        }
        if (other.end.index > this.end.index) {
            this.end = other.end;
        }
    }
    valueOf() {
        return this.end.index;
    }
    clone() {
        return new ReferenceRange(this.start.clone(), this.end.clone());
    }
    toString() {
        return `${this.start.toString()} -> ${this.end.toString()}`;
    }
}
export function DecodeBase64(base64) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let bufferLength = base64.length * 0.75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
    if (base64[base64.length - 1] === '=') {
        bufferLength--;
        if (base64[base64.length - 2] === '=') {
            bufferLength--;
        }
    }
    let bytes = new Uint8Array(bufferLength);
    for (i = 0; i < len; i += 4) {
        encoded1 = chars.indexOf(base64[i]);
        encoded2 = chars.indexOf(base64[i + 1]);
        encoded3 = chars.indexOf(base64[i + 2]);
        encoded4 = chars.indexOf(base64[i + 3]);
        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
    return bytes;
}
