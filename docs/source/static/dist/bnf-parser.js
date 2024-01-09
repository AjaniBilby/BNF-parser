import binaryen from 'https://unpkg.com/binaryen@113.0.0/index.js';

let ParseError$1 = class ParseError {
    stack;
    msg;
    ref;
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
};
let SyntaxNode$2 = class SyntaxNode {
    type;
    start;
    end;
    count;
    value;
    ref;
    constructor(type, start, end, count, ref) {
        this.type = type;
        this.start = start;
        this.end = end;
        this.count = count;
        this.value = [];
        this.ref = ref;
    }
};
let Reference$1 = class Reference {
    line;
    col;
    index;
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
    static blank() {
        return new Reference(1, 1, 0);
    }
};
let ReferenceRange$1 = class ReferenceRange {
    start;
    end;
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
    static union(a, b) {
        return new ReferenceRange(a.start.index < b.start.index ? a.start.clone() : b.start.clone(), // Smallest
        a.end.index > b.end.index ? a.end.clone() : b.end.clone());
    }
    static intersection(a, b) {
        let start = a.start.index > b.start.index ? a.start.clone() : b.start.clone(); // Largest
        let end = a.end.index < b.end.index ? a.end.clone() : b.end.clone(); // Smallest
        return new ReferenceRange(
        // Make sure start and end haven't switched
        start.index > end.index ? start : end, start.index > end.index ? end : start);
    }
    static blank() {
        return new ReferenceRange(Reference$1.blank(), Reference$1.blank());
    }
};
function AssertUnreachable$1(x) {
    throw new Error("Unreachable code path reachable");
}

let SyntaxNode$1 = class SyntaxNode {
    type;
    value;
    ref;
    reach;
    constructor(type, value, ref) {
        this.type = type;
        this.ref = ref;
        this.value = value;
        this.reach = null;
    }
    getReach() {
        if (this.reach) {
            return this.reach;
        }
        if (typeof this.value == "string") {
            return null;
        }
        if (this.value.length == 0) {
            return null;
        }
        return this.value[this.value.length - 1].getReach();
    }
    flat() {
        if (Array.isArray(this.value)) {
            return this.value
                .map(x => x.flat())
                .reduce((prev, x) => prev + x, "");
        }
        else {
            return this.value;
        }
    }
};

function ParseExpression(json) {
    switch (json['type']) {
        case "literal": return new Literal(json);
        case "range": return new CharRange(json);
        case "term": return new Term(json);
        case "not": return new Not(json);
        case "omit": return new Omit(json);
        case "gather": return new Gather(json);
        case "select": return new Select(json);
        case "sequence": return new Sequence(json);
        default:
            throw new TypeError(`Unknown expression type "${json['type']}"`);
    }
}
var Count;
(function (Count) {
    Count["One"] = "1";
    Count["ZeroToOne"] = "?";
    Count["ZeroToMany"] = "*";
    Count["OneToMany"] = "+";
})(Count || (Count = {}));
function ParseCount(count) {
    switch (count) {
        case "1": return Count.One;
        case "?": return Count.ZeroToOne;
        case "*": return Count.ZeroToMany;
        case "+": return Count.OneToMany;
        default: throw new Error(`Unknown count "${count}"`);
    }
}
function CountCheck(count, mode) {
    if (count < 1 && (mode == Count.One ||
        mode == Count.OneToMany)) {
        return false;
    }
    else if (count > 1 && (mode == Count.ZeroToOne ||
        mode == Count.One)) {
        return false;
    }
    else {
        return true;
    }
}
class Literal {
    value;
    count;
    ref;
    constructor(json) {
        this.value = json['value'];
        this.count = ParseCount(json['count']);
        this.ref = json['ref'] || undefined;
    }
    parse(input, ctx, cursor) {
        let start = cursor.clone();
        let consumption = 0;
        while (true) {
            if (consumption >= 1 && (this.count == Count.One || this.count == Count.ZeroToOne)) {
                break;
            }
            if (this.match(input, cursor)) {
                consumption++;
            }
            else {
                break;
            }
        }
        let range = new ReferenceRange$1(start, cursor);
        if (!CountCheck(consumption, this.count)) {
            return new ParseError$1(`Didn't consume the correct amount. ${consumption} ¬ ${this.count}`, range);
        }
        return new SyntaxNode$1("literal", input.slice(start.index, cursor.index), range);
    }
    match(input, cursor) {
        if (this.value.length == 0) {
            return false;
        }
        for (let i = 0; i < this.value.length; i++) {
            if (cursor.index >= input.length) {
                return false;
            }
            if (this.value[i] == input[cursor.index]) {
                cursor.advance(input[cursor.index] == "\n");
            }
            else {
                return false;
            }
        }
        return true;
    }
    serialize() {
        return {
            type: "literal",
            value: this.value,
            count: this.count
        };
    }
}
class CharRange extends Literal {
    to;
    constructor(json) {
        super(json);
        this.to = json['to'];
    }
    match(input, cursor) {
        if (cursor.index >= input.length) {
            return false;
        }
        if (this.value <= input[cursor.index] && input[cursor.index] <= this.to) {
            cursor.advance(input[cursor.index] == "\n");
            return true;
        }
        return false;
    }
    matchChar(char, offset) {
        return this.value <= char && char <= this.to;
    }
    serialize() {
        let out = super.serialize();
        out.type = "range";
        out.to = this.to;
        return out;
    }
}
class Gather {
    expr;
    ref;
    constructor(json) {
        this.expr = ParseExpression(json['expr']);
        this.ref = json['ref'] || undefined;
    }
    parse(input, ctx, cursor) {
        let res = this.expr.parse(input, ctx, cursor);
        if (res instanceof ParseError$1) {
            return res;
        }
        res.value = res.flat();
        return res;
    }
    serialize() {
        return {
            type: "gather",
            expr: this.expr.serialize()
        };
    }
}
class Omit extends Gather {
    parse(input, ctx, cursor) {
        let res = this.expr.parse(input, ctx, cursor);
        if (res instanceof ParseError$1) {
            return res;
        }
        return new SyntaxNode$1("omit", "", res.ref);
    }
    serialize() {
        let out = super.serialize();
        out.type = "omit";
        return out;
    }
}
class Not {
    expr;
    count;
    ref;
    constructor(json) {
        this.expr = ParseExpression(json['expr']);
        this.count = ParseCount(json['count']);
        this.ref = json['ref'] || undefined;
    }
    parse(input, ctx, cursor) {
        let start = cursor.clone();
        let consumption = 0;
        while (true) {
            if (consumption >= 1 && (this.count == Count.One || this.count == Count.ZeroToOne)) {
                break;
            }
            if (cursor.index >= input.length) {
                break;
            }
            let check = this.expr.parse(input, ctx, cursor.clone());
            if (check instanceof ParseError$1) {
                cursor.advance(input[cursor.index] == "\n");
                consumption++;
            }
            else {
                break;
            }
        }
        let range = new ReferenceRange$1(start, cursor);
        if (!CountCheck(consumption, this.count)) {
            return new ParseError$1(`Didn't consume the correct amount. ${consumption} ${this.count}`, range);
        }
        return new SyntaxNode$1("literal", input.slice(start.index, cursor.index), range);
    }
    serialize() {
        return {
            type: "not",
            count: this.count,
            expr: this.expr.serialize()
        };
    }
}
class Term {
    value;
    count;
    ref;
    constructor(json) {
        this.value = json['value'];
        this.count = ParseCount(json['count']);
        this.ref = json['ref'] || undefined;
    }
    parse(input, ctx, cursor) {
        let expr = ctx.getRule(this.value);
        let start = cursor.clone();
        let consumption = 0;
        let err = null;
        let nodes = [];
        while (true) {
            if (consumption >= 1 && (this.count == Count.One || this.count == Count.ZeroToOne)) {
                break;
            }
            if (cursor.index >= input.length) {
                break;
            }
            let res = expr.parse(input, ctx, cursor.clone());
            if (res instanceof ParseError$1) {
                err = res;
                break;
            }
            else {
                if (this.count == Count.One) {
                    return res;
                }
                cursor = res.ref.end;
                nodes.push(res);
                consumption++;
            }
        }
        let range = new ReferenceRange$1(start, cursor);
        if (!CountCheck(consumption, this.count)) {
            if (!err) {
                err = new ParseError$1(`Didn't consume the correct amount. ${consumption} ${this.count}`, range);
            }
            err.add_stack(this.value);
            return err;
        }
        let out = new SyntaxNode$1(this.value + this.count, nodes, range);
        out.reach = err?.ref || null;
        return out;
    }
    serialize() {
        return {
            type: "term",
            value: this.value,
            count: this.count
        };
    }
}
class Select {
    exprs;
    count;
    ref;
    constructor(json) {
        this.exprs = [];
        this.count = ParseCount(json['count']);
        this.ref = json['ref'] || undefined;
        for (let value of json['exprs']) {
            this.exprs.push(ParseExpression(value));
        }
    }
    parse(input, ctx, cursor) {
        let count = 0;
        let start = cursor.clone();
        let err = null;
        let nodes = [];
        while (true) {
            if (count >= 1 && (this.count == Count.One || this.count == Count.ZeroToOne)) {
                break;
            }
            let res = this.parseSingle(input, ctx, cursor.clone());
            if (res instanceof ParseError$1) {
                err = res;
                break;
            }
            cursor = res.ref.end.clone();
            nodes.push(res);
            count++;
        }
        if (!CountCheck(count, this.count)) {
            if (!err) {
                err = new ParseError$1("Invalid count of sequence", new ReferenceRange$1(start, cursor));
            }
            return err;
        }
        let out = new SyntaxNode$1(`(...)${this.count == "1" ? "" : this.count}`, nodes, new ReferenceRange$1(start, cursor));
        if (err) {
            out.reach = err.ref;
        }
        return out;
    }
    parseSingle(input, ctx, cursor) {
        let err = null;
        for (let opt of this.exprs) {
            let res = opt.parse(input, ctx, cursor.clone());
            if (res instanceof ParseError$1) {
                if (!err || err.ref.end.index <= res.ref.end.index) {
                    err = res;
                }
                continue;
            }
            else {
                return res;
            }
        }
        return err ||
            new ParseError$1("No valid option found", new ReferenceRange$1(cursor, cursor));
    }
    serialize() {
        return {
            type: "select",
            count: this.count,
            exprs: this.exprs.map(x => x.serialize())
        };
    }
}
class Sequence extends Select {
    constructor(json) {
        super(json);
    }
    parse(input, ctx, cursor) {
        let out = super.parse(input, ctx, cursor);
        if (out instanceof ParseError$1) {
            return out;
        }
        if (this.count == Count.One) {
            return out.value[0];
        }
        return out;
    }
    parseSingle(input, ctx, cursor) {
        let start = cursor.clone();
        let nodes = [];
        let reach = null;
        for (let rule of this.exprs) {
            let res = rule.parse(input, ctx, cursor.clone());
            if (res instanceof ParseError$1) {
                if (reach && reach.end.index > res.ref.end.index) {
                    res.ref = reach;
                    res.msg += "Unexpected syntax error (code POL)";
                }
                return res;
            }
            cursor = res.ref.end;
            let nx_reach = res.getReach();
            if (nx_reach) {
                if (!reach || reach.valueOf() < nx_reach.valueOf()) {
                    reach = nx_reach;
                }
            }
            if (rule instanceof Omit) {
                continue; // skip omitted operands
            }
            else {
                // Merge selection of a single item inline
                if (rule instanceof Select && rule.count == Count.One) {
                    nodes.push(res.value[0]);
                    continue;
                }
                nodes.push(res);
            }
        }
        let out = new SyntaxNode$1('seq[]', nodes, new ReferenceRange$1(start, cursor));
        out.reach = reach;
        return out;
    }
    serialize() {
        let out = super.serialize();
        out.type = "sequence";
        return out;
    }
}
class Rule {
    name;
    seq;
    verbose;
    ref;
    constructor(name, json, ref) {
        this.name = name;
        this.seq = ParseExpression(json);
        this.verbose = false;
    }
    parse(input, ctx, cursor) {
        if (this.verbose) {
            console.log(`Parsing rule "${this.name}" at ${cursor.toString()}`);
        }
        let res = this.seq.parse(input, ctx, cursor);
        if (res instanceof SyntaxNode$1) {
            res.type = this.name;
        }
        return res;
    }
    setVerbose(mode) {
        this.verbose = mode;
    }
    serialize() {
        return this.seq.serialize();
    }
}
class Parser {
    terms;
    constructor(json) {
        this.terms = new Map();
        for (let key in json) {
            this.addRule(key, new Rule(key, json[key]));
        }
    }
    getRule(name) {
        let rule = this.terms.get(name);
        if (rule == null) {
            throw new ReferenceError(`Unknown Rule ${name}`);
        }
        return rule;
    }
    addRule(name, rule) {
        if (this.terms.has(name)) {
            throw new Error(`Attempting to add rule "${name}" to a parser which already has a rule of that name`);
        }
        this.terms.set(name, rule);
    }
    parse(input, partial = false, entry = "program") {
        let entryTerm = this.getRule(entry);
        let res = entryTerm.parse(input, this, new Reference$1(1, 1, 0));
        if (res instanceof ParseError$1) {
            return res;
        }
        if (!partial && res.ref.end.index != input.length) {
            return new ParseError$1("Unexpected syntax at ", res.getReach() || new ReferenceRange$1(res.ref.end.clone(), res.ref.end));
        }
        return res;
    }
    setVerbose(mode) {
        for (let key of this.terms.keys()) {
            this.terms.get(key)?.setVerbose(mode);
        }
    }
    serialize() {
        let blob = {};
        for (let [key, rule] of this.terms) {
            blob[key] = rule.serialize();
        }
        return blob;
    }
}

// Using a class for better V8 performance
class Mapping {
    value;
    bytes;
    offset;
    constructor(value, bytes, offset) {
        this.value = value;
        this.bytes = bytes;
        this.offset = offset;
        Object.freeze(this);
    }
}
class LiteralMapping {
    encoder;
    values;
    size;
    constructor() {
        this.encoder = new TextEncoder();
        this.values = [];
        this.size = 0;
    }
    addKey(val) {
        const bytes = this.encoder.encode(val);
        const res = this.values.find(x => x.value === val);
        if (res)
            return;
        this.values.push(new Mapping(val, bytes, this.size));
        this.size += bytes.byteLength;
    }
    getKey(val) {
        const res = this.values.find(x => x.value === val);
        if (res)
            return res;
        throw new Error(`Internal error: Unmapped literal ${val}`);
    }
    static Uint8ArraysEqual(a, b) {
        if (a.length != b.length)
            return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] != b[i])
                return false;
        }
        return true;
    }
    ingestBnf(bnf) {
        this.addKey("literal");
        this.addKey("(...)");
        this.addKey("(...)?");
        this.addKey("(...)*");
        this.addKey("(...)+");
        for (let [_, rule] of bnf.terms) {
            this.ingestBnfExpression(rule.seq);
            this.addKey(rule.name);
        }
    }
    ingestBnfExpression(expr) {
        if (expr instanceof Literal) {
            this.addKey(expr.value);
        }
        else if (expr instanceof Not || expr instanceof Omit || expr instanceof Gather) {
            this.ingestBnfExpression(expr.expr);
        }
        else if (expr instanceof Select || expr instanceof Sequence) {
            expr.exprs.forEach(x => this.ingestBnfExpression(x));
        }
    }
}

// Using OO because of better V8 memory optimisations
class DebugInfoLine {
    expr;
    ref;
    constructor(expr, ref) {
        this.expr = expr;
        this.ref = ref;
    }
}
// Using OO because of better V8 memory optimisations
class CompilerContext {
    m;
    l;
    vars;
    _blocks;
    _bID;
    _debugInfo;
    _debugEnabled;
    constructor(m, literals, rule) {
        this.m = m;
        this.l = literals;
        this.vars = [];
        this._blocks = [];
        this._bID = 1;
        this._debugEnabled = true;
        this._debugInfo = [];
    }
    enableDebugging(state) {
        this._debugEnabled = state;
    }
    pushBlock(label) {
        if (!label)
            label = this.reserveBlock();
        this._blocks.push(label);
        return label;
    }
    reserveBlock() {
        return `_bb${(this._bID++).toString()}`;
    }
    popBlock() {
        const out = this._blocks.pop();
        if (!out)
            throw new Error("Attempting to pop block when no blocks remain in context");
        return out;
    }
    declareVar(type) {
        const index = this.vars.length;
        this.vars.push(type);
        return index;
    }
    bindDebug(expr, ref) {
        if (!this._debugEnabled)
            return;
        this._debugInfo.push(new DebugInfoLine(expr, ref));
    }
    applyDebugInfo(funcID, fileID) {
        if (!this._debugEnabled)
            return;
        for (const binding of this._debugInfo) {
            this.m.setDebugLocation(funcID, binding.expr, fileID, binding.ref.line, binding.ref.col);
        }
    }
}

const OFFSET$1 = {
    TYPE: 0 * 4,
    TYPE_LEN: 1 * 4,
    START: 2 * 4,
    END: 3 * 4,
    COUNT: 4 * 4,
    DATA: 5 * 4, // offset for first child
};

const SHARED = {
    ERROR: 0, // local variable for error flag
};
function CompileExpression$1(ctx, expr, name) {
    switch (expr.constructor.name) {
        case "Sequence": return CompileSequence$1(ctx, expr, name);
        case "Select": return CompileSelect$1(ctx, expr);
        case "Literal": return CompileLiteral$1(ctx, expr);
        case "CharRange": return CompileRange$1(ctx, expr);
        case "Omit": return CompileOmit$1(ctx, expr);
        case "Term": return CompileTerm$1(ctx, expr);
        case "Not": return CompileNot$1(ctx, expr);
        case "Gather": return CompileGather$1(ctx, expr);
    }
    throw new Error(`Unexpected expression type ${expr.constructor.name} during compilation`);
}
function CompileSequence$1(ctx, expr, name) {
    const once = CompileSequenceOnce$1(ctx, expr, name);
    if (expr.count === "1") {
        return once;
    }
    else {
        return CompileRepeat$1(ctx, once, expr.count);
    }
}
function CompileSequenceOnce$1(ctx, expr, name) {
    // const index  = SHARED.INDEX;
    const error = SHARED.ERROR;
    const rewind = ctx.declareVar(binaryen.i32);
    if (!name) {
        name = "(...)";
    }
    const literal = ctx.l.getKey(name);
    const visibleChildren = expr.exprs.reduce((s, c) => {
        if (c instanceof Omit)
            return s;
        return s + 1;
    }, 0);
    const lblBody = ctx.reserveBlock();
    const out = ctx.m.block(null, [
        ctx.m.local.set(rewind, ctx.m.global.get("heap", binaryen.i32)),
        ctx.m.i32.store(OFFSET$1.START, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.global.get("index", binaryen.i32)),
        ctx.m.global.set("heap", ctx.m.i32.add(ctx.m.local.get(rewind, binaryen.i32), ctx.m.i32.const(OFFSET$1.DATA))),
        ctx.m.block(lblBody, expr.exprs.flatMap((child) => [
            CompileExpression$1(ctx, child),
            // Stop parsing if child failed to parse
            ctx.m.br(lblBody, ctx.m.i32.eq(ctx.m.local.get(error, binaryen.i32), ctx.m.i32.const(1)))
        ])),
        ctx.m.if(ctx.m.i32.eq(ctx.m.local.get(error, binaryen.i32), ctx.m.i32.const(1)), ctx.m.block(null, [
            // mark failed + rollback ALL progress
            ctx.m.local.set(error, ctx.m.i32.const(1)),
            ctx.m.global.set("index", ctx.m.i32.load(OFFSET$1.START, 4, ctx.m.local.get(rewind, binaryen.i32))),
            ctx.m.global.set("heap", ctx.m.local.get(rewind, binaryen.i32))
        ]), ctx.m.block(null, [
            // Success
            ctx.m.i32.store(OFFSET$1.TYPE, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.i32.const(literal.offset)),
            ctx.m.i32.store(OFFSET$1.TYPE_LEN, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.i32.const(literal.bytes.byteLength)),
            // End index
            ctx.m.i32.store(OFFSET$1.END, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.global.get("index", binaryen.i32)),
            // Child count
            ctx.m.i32.store(OFFSET$1.COUNT, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.i32.const(visibleChildren))
        ]))
    ]);
    if (expr.ref)
        ctx.bindDebug(out, expr.ref);
    return out;
}
function CompileSelect$1(ctx, expr) {
    const once = CompileSelectOnce$1(ctx, expr);
    if (expr.count === "1") {
        return once;
    }
    else {
        return CompileRepeat$1(ctx, once, expr.count);
    }
}
function CompileSelectOnce$1(ctx, expr) {
    const error = SHARED.ERROR;
    const lblBody = ctx.reserveBlock();
    const body = [];
    body.push(ctx.m.block(lblBody, expr.exprs.flatMap((child) => [
        // Reset error state for previous failures
        ctx.m.local.set(error, ctx.m.i32.const(0)),
        // On failure already cleans up after itself
        CompileExpression$1(ctx, child),
        // Stop parsing if child succeeded to parse
        ctx.m.br(lblBody, ctx.m.i32.eq(ctx.m.local.get(error, binaryen.i32), ctx.m.i32.const(0)))
    ])));
    const out = ctx.m.block(null, body);
    if (expr.ref)
        ctx.bindDebug(out, expr.ref);
    return out;
}
function CompileOmit$1(ctx, expr) {
    const rewind = ctx.declareVar(binaryen.i32);
    const out = ctx.m.block(null, [
        ctx.m.local.set(rewind, ctx.m.global.get("heap", binaryen.i32)),
        CompileExpression$1(ctx, expr.expr),
        ctx.m.global.set("heap", ctx.m.local.get(rewind, binaryen.i32)),
    ]);
    if (expr.ref)
        ctx.bindDebug(out, expr.ref);
    return out;
}
function CompileGather$1(ctx, expr) {
    const error = SHARED.ERROR;
    const rewind = ctx.declareVar(binaryen.i32);
    const literal = ctx.l.getKey("literal");
    const out = ctx.m.block(null, [
        ctx.m.local.set(rewind, ctx.m.global.get("heap", binaryen.i32)),
        // All meta set after the fact
        CompileExpression$1(ctx, expr.expr),
        ctx.m.if(ctx.m.i32.eq(ctx.m.local.get(error, binaryen.i32), ctx.m.i32.const(1)), ctx.m.block(null, [
            // Unwind error
            ctx.m.global.set("heap", ctx.m.local.get(rewind, binaryen.i32)),
        ]), ctx.m.block(null, [
            ctx.m.i32.store(OFFSET$1.COUNT, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.call("_gather", [
                ctx.m.local.get(rewind, binaryen.i32),
                ctx.m.i32.add(ctx.m.local.get(rewind, binaryen.i32), ctx.m.i32.const(OFFSET$1.DATA))
            ], binaryen.i32)),
            // Override type
            ctx.m.i32.store(OFFSET$1.TYPE, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.i32.const(literal.offset)),
            ctx.m.i32.store(OFFSET$1.TYPE_LEN, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.i32.const(literal.bytes.byteLength)),
            // Heap position
            ctx.m.global.set("heap", ctx.m.call("_roundWord", [
                ctx.m.i32.add(ctx.m.local.get(rewind, binaryen.i32), ctx.m.i32.add(ctx.m.i32.load(OFFSET$1.COUNT, 4, ctx.m.local.get(rewind, binaryen.i32)), ctx.m.i32.const(OFFSET$1.DATA)))
            ], binaryen.i32))
        ]))
    ]);
    if (expr.ref)
        ctx.bindDebug(out, expr.ref);
    return out;
}
function CompileTerm$1(ctx, expr) {
    const once = CompileTermOnce$1(ctx, expr);
    if (expr.count === "1") {
        return once;
    }
    else {
        return CompileRepeat$1(ctx, once, expr.count);
    }
}
function CompileTermOnce$1(ctx, expr) {
    // const index  = SHARED.INDEX;
    const error = SHARED.ERROR;
    const rewind = ctx.declareVar(binaryen.i32);
    const out = ctx.m.block(null, [
        ctx.m.local.set(rewind, ctx.m.global.get("heap", binaryen.i32)),
        // Forward processing to child
        ctx.m.local.set(error, ctx.m.call(expr.value, [], binaryen.i32))
    ]);
    if (expr.ref)
        ctx.bindDebug(out, expr.ref);
    return out;
}
function CompileNot$1(ctx, expr) {
    const error = SHARED.ERROR;
    const rewind = ctx.declareVar(binaryen.i32);
    const count = ctx.declareVar(binaryen.i32);
    const literal = ctx.l.getKey("literal");
    const outer = ctx.reserveBlock();
    const block = ctx.reserveBlock();
    const loop = ctx.reserveBlock();
    const out = ctx.m.block(outer, [
        // Store information for failure reversion
        ctx.m.local.set(rewind, ctx.m.global.get("heap", binaryen.i32)),
        ctx.m.local.set(count, ctx.m.i32.const(0)),
        // Start index
        ctx.m.i32.store(OFFSET$1.START, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.global.get("index", binaryen.i32)),
        // Backup reach
        ctx.m.i32.store(OFFSET$1.END, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.global.get("reach", binaryen.i32)),
        ctx.m.global.set("heap", ctx.m.i32.add(ctx.m.local.get(rewind, binaryen.i32), ctx.m.i32.const(OFFSET$1.DATA))),
        ctx.m.block(block, [
            ctx.m.loop(loop, ctx.m.block(null, [
                ctx.m.br(block, ctx.m.i32.ge_s(ctx.m.global.get("index", binaryen.i32), ctx.m.global.get("inputLength", binaryen.i32))),
                ctx.m.local.set(error, ctx.m.i32.const(0)),
                CompileExpression$1(ctx, expr.expr),
                // Break loop if match succeeded
                ctx.m.br(block, ctx.m.i32.eq(ctx.m.local.get(error, binaryen.i32), ctx.m.i32.const(0))),
                // Increment count
                ctx.m.local.set(count, ctx.m.i32.add(ctx.m.local.get(count, binaryen.i32), ctx.m.i32.const(1))),
                ctx.m.global.set("index", ctx.m.i32.add(ctx.m.global.get("index", binaryen.i32), ctx.m.i32.const(1))),
                // Hit limit count, break loop
                expr.count == "?" || expr.count == "1" ?
                    ctx.m.br(block) :
                    ctx.m.nop(),
                // Continue loop
                ctx.m.br(loop)
            ]))
        ]),
        // Fix reach which might have been corrupted by NOT's child
        ctx.m.global.set("reach", ctx.m.i32.load(OFFSET$1.END, 4, ctx.m.local.get(rewind, binaryen.i32))),
        // Update to true reach
        ctx.m.call("_reach_update", [
            ctx.m.i32.add(ctx.m.i32.load(OFFSET$1.START, 4, ctx.m.local.get(rewind, binaryen.i32)), ctx.m.local.get(count, binaryen.i32))
        ], binaryen.none),
        // Check satisfies count
        /*
            At this point given repetition:
                ?, 1: Exited the loop once 1 had been reached, 0 -> 1
                *, +: Exited when failed so 0 -> many
        */
        expr.count == "+" || expr.count == "1" ?
            ctx.m.if(ctx.m.i32.lt_s(ctx.m.local.get(count, binaryen.i32), ctx.m.i32.const(1)), ctx.m.block(null, [
                // mark failed + rollback ALL progress
                ctx.m.local.set(error, ctx.m.i32.const(1)),
                ctx.m.global.set("index", ctx.m.i32.load(OFFSET$1.START, 4, ctx.m.local.get(rewind, binaryen.i32))),
                ctx.m.global.set("heap", ctx.m.local.get(rewind, binaryen.i32)),
                ctx.m.br(outer)
            ])) :
            ctx.m.nop(),
        // UNO REVERSE! This is a NOT statement
        ctx.m.local.set(error, ctx.m.i32.const(0)),
        // The exit case of the loop means the NOT's child was successful
        // 	This child likely pushed index forwards, correct the index position
        ctx.m.global.set("index", ctx.m.i32.add(ctx.m.i32.load(OFFSET$1.START, 4, ctx.m.local.get(rewind, binaryen.i32)), ctx.m.local.get(count, binaryen.i32))),
        // Node Meta
        ctx.m.i32.store(OFFSET$1.TYPE, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.i32.const(literal.offset)),
        ctx.m.i32.store(OFFSET$1.TYPE_LEN, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.i32.const(literal.bytes.byteLength)),
        ctx.m.i32.store(OFFSET$1.END, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.global.get("index", binaryen.i32)),
        // Count index
        ctx.m.i32.store(OFFSET$1.COUNT, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.local.get(count, binaryen.i32)),
        // Copy in the data
        ctx.m.call("_memcpy", [
            ctx.m.i32.add(ctx.m.local.get(rewind, binaryen.i32), ctx.m.i32.const(OFFSET$1.DATA)),
            ctx.m.i32.add(ctx.m.global.get("input", binaryen.i32), ctx.m.i32.load(OFFSET$1.START, 4, ctx.m.local.get(rewind, binaryen.i32))),
            ctx.m.local.get(count, binaryen.i32),
        ], binaryen.none),
        // Update new heap tail
        ctx.m.global.set("heap", ctx.m.call("_roundWord", [
            ctx.m.i32.add(ctx.m.local.get(rewind, binaryen.i32), ctx.m.i32.add(ctx.m.local.get(count, binaryen.i32), ctx.m.i32.const(OFFSET$1.DATA)))
        ], binaryen.i32)),
    ]);
    if (expr.ref)
        ctx.bindDebug(out, expr.ref);
    return out;
}
function CompileRange$1(ctx, expr) {
    const error = SHARED.ERROR;
    const rewind = ctx.declareVar(binaryen.i32);
    const count = ctx.declareVar(binaryen.i32);
    const literal = ctx.l.getKey("literal");
    const outer = ctx.reserveBlock();
    const block = ctx.reserveBlock();
    const loop = ctx.reserveBlock();
    const out = ctx.m.block(outer, [
        // Store information for failure reversion
        ctx.m.local.set(rewind, ctx.m.global.get("heap", binaryen.i32)),
        ctx.m.local.set(count, ctx.m.i32.const(0)),
        // Start index
        ctx.m.i32.store(OFFSET$1.START, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.global.get("index", binaryen.i32)),
        ctx.m.block(block, [
            ctx.m.loop(loop, ctx.m.block(null, [
                ctx.m.br(block, ctx.m.i32.ge_s(ctx.m.global.get("index", binaryen.i32), ctx.m.global.get("inputLength", binaryen.i32))),
                // Break loop if char not in range
                ctx.m.br(block, ctx.m.i32.or(ctx.m.i32.gt_s(ctx.m.i32.load8_u(0, 1, ctx.m.i32.add(ctx.m.global.get("index", binaryen.i32), ctx.m.global.get("input", binaryen.i32))), ctx.m.i32.const(expr.to.charCodeAt(0))), ctx.m.i32.lt_s(ctx.m.i32.load8_u(0, 1, ctx.m.i32.add(ctx.m.global.get("index", binaryen.i32), ctx.m.global.get("input", binaryen.i32))), ctx.m.i32.const(expr.value.charCodeAt(0))))),
                // Increment count
                ctx.m.local.set(count, ctx.m.i32.add(ctx.m.local.get(count, binaryen.i32), ctx.m.i32.const(1))),
                ctx.m.global.set("index", ctx.m.i32.add(ctx.m.global.get("index", binaryen.i32), ctx.m.i32.const(1))),
                // Break loop since hit count limit
                expr.count == "?" || expr.count == "1" ?
                    ctx.m.br(block) :
                    ctx.m.nop(),
                // Continue loop
                ctx.m.br(loop)
            ]))
        ]),
        // Update the reach
        ctx.m.call("_reach_update", [
            ctx.m.global.get("index", binaryen.i32)
        ], binaryen.none),
        // Check satisfies count
        /*
            At this point given repetition:
                ?, 1: Exited the loop once 1 had been reached, 0 -> 1
                *, +: Exited when failed so 0 -> many
        */
        expr.count == "+" || expr.count == "1" ?
            ctx.m.if(ctx.m.i32.lt_s(ctx.m.local.get(count, binaryen.i32), ctx.m.i32.const(1)), ctx.m.block(null, [
                // mark failed + rollback ALL progress
                ctx.m.local.set(error, ctx.m.i32.const(1)),
                ctx.m.global.set("index", ctx.m.i32.load(OFFSET$1.START, 4, ctx.m.local.get(rewind, binaryen.i32))),
                ctx.m.global.set("heap", ctx.m.local.get(rewind, binaryen.i32)),
                ctx.m.br(outer)
            ])) :
            ctx.m.nop(),
        // Node Meta
        ctx.m.i32.store(OFFSET$1.TYPE, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.i32.const(literal.offset)),
        ctx.m.i32.store(OFFSET$1.TYPE_LEN, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.i32.const(literal.bytes.byteLength)),
        ctx.m.i32.store(OFFSET$1.END, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.global.get("index", binaryen.i32)),
        // Count index
        ctx.m.i32.store(OFFSET$1.COUNT, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.local.get(count, binaryen.i32)),
        // Copy in the data
        ctx.m.call("_memcpy", [
            ctx.m.i32.add(ctx.m.local.get(rewind, binaryen.i32), ctx.m.i32.const(OFFSET$1.DATA)),
            ctx.m.i32.add(ctx.m.global.get("input", binaryen.i32), ctx.m.i32.load(OFFSET$1.START, 4, ctx.m.local.get(rewind, binaryen.i32))),
            ctx.m.local.get(count, binaryen.i32),
        ], binaryen.none),
        // Update new heap tail
        ctx.m.global.set("heap", ctx.m.call("_roundWord", [
            ctx.m.i32.add(ctx.m.local.get(rewind, binaryen.i32), ctx.m.i32.add(ctx.m.local.get(count, binaryen.i32), ctx.m.i32.const(OFFSET$1.DATA)))
        ], binaryen.i32)),
    ]);
    if (expr.ref)
        ctx.bindDebug(out, expr.ref);
    return out;
}
function CompileLiteral$1(ctx, expr) {
    const once = CompileLiteralOnce$1(ctx, expr);
    if (expr.count === "1") {
        return once;
    }
    else {
        return CompileRepeat$1(ctx, once, expr.count);
    }
}
function CompileLiteralOnce$1(ctx, expr) {
    // const index    = SHARED.INDEX;
    const error = SHARED.ERROR;
    const literal = ctx.l.getKey(expr.value);
    if (literal.bytes.byteLength === 0) {
        return ctx.m.block(null, [
            ctx.m.local.set(error, ctx.m.i32.const(1))
        ]);
    }
    const rewind = ctx.declareVar(binaryen.i32);
    const progress = ctx.declareVar(binaryen.i32);
    const type = ctx.l.getKey("literal");
    const block = ctx.pushBlock();
    const out = ctx.m.block(block, [
        // Store information for failure reversion
        ctx.m.local.set(rewind, ctx.m.global.get("heap", binaryen.i32)),
        // Start index
        ctx.m.i32.store(OFFSET$1.START, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.global.get("index", binaryen.i32)),
        // Attempt match
        ctx.m.local.set(progress, ctx.m.call("_matchString", [
            ctx.m.global.get("index", binaryen.i32),
            ctx.m.i32.const(literal.offset),
            ctx.m.i32.const(literal.bytes.byteLength),
        ], binaryen.i32)),
        ctx.m.global.set("index", ctx.m.i32.add(ctx.m.local.get(progress, binaryen.i32), ctx.m.global.get("index", binaryen.i32))),
        // Update furthest reach
        ctx.m.call("_reach_update", [
            ctx.m.global.get("index", binaryen.i32),
        ], binaryen.none),
        // Check if fully matched literal
        ctx.m.if(ctx.m.i32.ne(ctx.m.local.get(progress, binaryen.i32), ctx.m.i32.const(literal.bytes.byteLength)), ctx.m.block(null, [
            ctx.m.local.set(error, ctx.m.i32.const(1)),
            // roll back progress
            ctx.m.global.set("index", ctx.m.i32.load(OFFSET$1.START, 4, ctx.m.local.get(rewind, binaryen.i32))),
            ctx.m.global.set("heap", ctx.m.local.get(rewind, binaryen.i32)),
            ctx.m.br(ctx.popBlock())
        ])),
        // Node META
        ctx.m.i32.store(OFFSET$1.TYPE, 4, ctx.m.global.get("heap", binaryen.i32), ctx.m.i32.const(type.offset)),
        ctx.m.i32.store(OFFSET$1.TYPE_LEN, 4, ctx.m.global.get("heap", binaryen.i32), ctx.m.i32.const(type.bytes.byteLength)),
        ctx.m.i32.store(OFFSET$1.END, 4, ctx.m.global.get("heap", binaryen.i32), ctx.m.global.get("index", binaryen.i32)),
        ctx.m.i32.store(OFFSET$1.COUNT, 4, ctx.m.global.get("heap", binaryen.i32), ctx.m.i32.const(literal.bytes.byteLength)),
        // Copy in the data
        ctx.m.call("_memcpy", [
            ctx.m.i32.add(ctx.m.local.get(rewind, binaryen.i32), ctx.m.i32.const(OFFSET$1.DATA)),
            ctx.m.i32.const(literal.offset),
            ctx.m.i32.const(literal.bytes.byteLength),
        ], binaryen.none),
        // Update new heap tail
        ctx.m.global.set("heap", ctx.m.call("_roundWord", [
            ctx.m.i32.add(ctx.m.local.get(rewind, binaryen.i32), ctx.m.i32.const(OFFSET$1.DATA + literal.bytes.byteLength))
        ], binaryen.i32)),
    ]);
    if (expr.ref)
        ctx.bindDebug(out, expr.ref);
    return out;
}
function CompileRepeat$1(ctx, innerWasm, repetitions) {
    if (repetitions === "1")
        throw new Error("Don't compile repetitions for 1 to 1 repetition");
    // const index = 0;
    const error = SHARED.ERROR;
    const rewind = ctx.declareVar(binaryen.i32);
    const count = ctx.declareVar(binaryen.i32);
    let name = "(...)" + repetitions;
    const literal = ctx.l.getKey(name);
    const outer = ctx.reserveBlock();
    const block = ctx.reserveBlock();
    const loop = ctx.reserveBlock();
    return ctx.m.block(outer, [
        // Store information for failure reversion
        ctx.m.local.set(rewind, ctx.m.global.get("heap", binaryen.i32)),
        ctx.m.local.set(count, ctx.m.i32.const(0)),
        // Start index
        ctx.m.i32.store(OFFSET$1.START, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.global.get("index", binaryen.i32)),
        ctx.m.global.set("heap", ctx.m.i32.add(ctx.m.local.get(rewind, binaryen.i32), ctx.m.i32.const(OFFSET$1.DATA))),
        ctx.m.block(block, [
            ctx.m.loop(loop, ctx.m.block(null, [
                innerWasm,
                // Break loop if match failed
                ctx.m.br(block, ctx.m.i32.eq(ctx.m.local.get(error, binaryen.i32), ctx.m.i32.const(1))),
                // Increment count
                ctx.m.local.set(count, ctx.m.i32.add(ctx.m.local.get(count, binaryen.i32), ctx.m.i32.const(1))),
                // Break loop if hit count limit
                repetitions == "?" ?
                    ctx.m.br(block, ctx.m.i32.eq(ctx.m.local.get(count, binaryen.i32), ctx.m.i32.const(1))) :
                    ctx.m.nop(),
                // Continue loop
                ctx.m.br(loop)
            ]))
        ]),
        // Check satisfies count
        /*
            At this point given repetition:
                1: Assertion error
                ?: Exited the loop once 1 has reached or 0 (both fine)
                +: Exited the loop may have less than 1
                *: Doesn't care
        */
        repetitions == "+" ?
            ctx.m.if(ctx.m.i32.lt_s(ctx.m.local.get(count, binaryen.i32), ctx.m.i32.const(1)), ctx.m.block(null, [
                // mark failed + rollback ALL progress
                ctx.m.local.set(error, ctx.m.i32.const(1)),
                ctx.m.global.set("index", ctx.m.i32.load(OFFSET$1.START, 4, ctx.m.local.get(rewind, binaryen.i32))),
                ctx.m.global.set("heap", ctx.m.local.get(rewind, binaryen.i32)),
                ctx.m.br(outer)
            ])) :
            ctx.m.nop(),
        // Last iteration might have failed
        //   However we can accept the previous iterations
        //   And the fail iteration should have rolled itself back already
        ctx.m.local.set(error, ctx.m.i32.const(0)),
        // Node Meta
        ctx.m.i32.store(OFFSET$1.TYPE, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.i32.const(literal.offset)),
        ctx.m.i32.store(OFFSET$1.TYPE_LEN, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.i32.const(literal.bytes.byteLength)),
        ctx.m.i32.store(OFFSET$1.END, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.global.get("index", binaryen.i32)),
        // Count index
        ctx.m.i32.store(OFFSET$1.COUNT, 4, ctx.m.local.get(rewind, binaryen.i32), ctx.m.local.get(count, binaryen.i32)),
    ]);
}
function CompileRule$1(m, literals, rule, fileID) {
    const ctx = new CompilerContext(m, literals, rule);
    ctx.enableDebugging(!!fileID);
    // Function input
    const error = ctx.declareVar(binaryen.i32);
    // Make sure all rules start with a sequence
    let inner = rule.seq;
    if (inner.constructor.name === "Select") {
        let child = inner;
        if (child.exprs.length === 1)
            child = child.exprs[0];
        inner = new Sequence({
            exprs: [],
            count: "1"
        });
        inner.exprs = [child];
    }
    else if (rule.seq.constructor.name !== "Sequence") {
        inner = new Sequence({
            exprs: [],
            count: "1"
        });
        inner.exprs = [rule.seq];
    }
    const innerWasm = CompileExpression$1(ctx, inner, rule.name);
    const entry = ctx.m.block(null, [
        ctx.m.local.set(error, ctx.m.i32.const(0)),
        // Auto grow if 1kb from end of memory
        ctx.m.if(ctx.m.i32.lt_s(ctx.m.i32.mul(ctx.m.memory.size(), ctx.m.i32.const(65536) // bytes per page
        ), ctx.m.i32.add(ctx.m.global.get("heap", binaryen.i32), ctx.m.i32.const(1024) // 1kb
        )), ctx.m.block(null, [
            rule.name === "expr_arg"
                ? ctx.m.call("print_i32", [
                    ctx.m.i32.sub(ctx.m.i32.mul(ctx.m.memory.size(), ctx.m.i32.const(65536) // bytes per page
                    ), ctx.m.global.get("heap", binaryen.i32))
                ], binaryen.none)
                : ctx.m.nop(),
            ctx.m.drop(ctx.m.memory.grow(ctx.m.i32.const(1)))
        ])),
        innerWasm,
        ctx.m.return(ctx.m.local.get(error, binaryen.i32))
    ]);
    if (rule.ref)
        ctx.bindDebug(entry, rule.ref);
    const funcID = ctx.m.addFunction(rule.name, binaryen.createType([]), binaryen.i32, ctx.vars, entry);
    ctx.m.addFunctionExport(rule.name, rule.name);
    if (fileID)
        ctx.applyDebugInfo(funcID, fileID);
}

function IngestLiterals(m, bnf) {
    const literals = new LiteralMapping();
    literals.ingestBnf(bnf);
    m.setMemory(1, 10, "memory", literals.values
        .filter(x => x.bytes.byteLength > 0)
        .map(x => ({
        data: x.bytes,
        offset: m.i32.const(x.offset)
    })));
    m.addGlobal("input", binaryen.i32, false, m.i32.const(literals.size));
    m.addGlobal("reach", binaryen.i32, true, m.i32.const(0));
    m.addGlobal("inputLength", binaryen.i32, true, m.i32.const(0));
    m.addGlobalExport("input", "input");
    m.addGlobalExport("reach", "reach");
    m.addGlobalExport("inputLength", "inputLength");
    m.addGlobal("heap", binaryen.i32, true, m.i32.const(0));
    m.addGlobal("index", binaryen.i32, true, m.i32.const(0));
    m.addGlobal("inputEnd", binaryen.i32, true, m.i32.const(0));
    {
        m.addGlobalExport("heap", "heap");
        m.addGlobalExport("index", "index");
        m.addGlobalExport("inputEnd", "inputEnd");
    }
    return literals;
}
function GenerateInit(m) {
    m.addFunction("_init", binaryen.none, binaryen.i32, [], m.block(null, [
        m.global.set("index", m.i32.const(0)),
        m.global.set("reach", m.i32.const(0)),
        m.global.set("inputEnd", m.i32.add(m.global.get("input", binaryen.i32), m.global.get("inputLength", binaryen.i32))),
        m.global.set("heap", m.call("_roundWord", [
            m.global.get("inputEnd", binaryen.i32)
        ], binaryen.i32)),
        m.return(m.global.get("heap", binaryen.i32))
    ]));
}
function GenerateRoundWord(m) {
    m.addFunction("_roundWord", binaryen.createType([binaryen.i32]), binaryen.i32, [], m.block(null, [
        m.return(m.i32.and(m.i32.add(m.local.get(0, binaryen.i32), m.i32.const(3)), m.i32.const(-4)))
    ]));
}
function GenerateMemCopy(m) {
    m.addFunction("_memcpy", binaryen.createType([binaryen.i32, binaryen.i32, binaryen.i32]), binaryen.none, [
        binaryen.i32
    ], m.block(null, [
        m.local.set(3, m.i32.const(0)),
        m.block("outer", [
            m.loop("loop", m.block(null, [
                m.i32.store8(0, 0, m.i32.add(m.local.get(0, binaryen.i32), m.local.get(3, binaryen.i32)), m.i32.load8_u(0, 0, m.i32.add(m.local.get(1, binaryen.i32), m.local.get(3, binaryen.i32)))),
                m.local.set(3, m.i32.add(m.local.get(3, binaryen.i32), m.i32.const(1))),
                m.br_if("outer", m.i32.ge_s(m.local.get(3, binaryen.i32), m.local.get(2, binaryen.i32))),
                m.br("loop")
            ]))
        ])
    ]));
}
function GenerateMatchString(m) {
    const input = 0;
    const target = 1;
    const targetLen = 2;
    const count = 3;
    m.addFunction("_matchString", binaryen.createType([binaryen.i32, binaryen.i32, binaryen.i32]), binaryen.i32, [
        binaryen.i32,
        binaryen.i32
    ], m.block(null, [
        // Make input index point absolute memory address
        m.local.set(input, m.i32.add(m.local.get(input, binaryen.i32), m.global.get("input", binaryen.i32))),
        m.local.set(count, m.i32.const(0)),
        m.block("outer", [
            m.loop("loop", m.block(null, [
                m.br_if("outer", m.i32.ne(m.i32.load8_u(0, 1, m.i32.add(m.local.get(input, binaryen.i32), m.local.get(count, binaryen.i32))), m.i32.load8_u(0, 1, m.i32.add(m.local.get(target, binaryen.i32), m.local.get(count, binaryen.i32))))),
                // Successful match, increment count
                m.local.set(count, m.i32.add(m.local.get(count, binaryen.i32), m.i32.const(1))),
                // Bounds check
                m.br_if("outer", m.i32.ge_s(m.local.get(count, binaryen.i32), m.local.get(targetLen, binaryen.i32))),
                m.br_if("outer", m.i32.ge_s(m.i32.add(m.local.get(input, binaryen.i32), m.local.get(count, binaryen.i32)), m.global.get("inputEnd", binaryen.i32))),
                m.br("loop")
            ]))
        ]),
        m.return(m.local.get(count, binaryen.i32))
    ]));
}
function GenerateReachUpdate(m) {
    m.addFunction("_reach_update", binaryen.createType([binaryen.i32]), binaryen.none, [], m.block(null, [
        m.if(m.i32.ge_s(m.local.get(0, binaryen.i32), m.global.get("reach", binaryen.i32)), m.block(null, [
            m.global.set("reach", m.local.get(0, binaryen.i32))
        ]))
    ]));
}
function GenerateGather(m, l) {
    const nodePtr = 0;
    const writePtr = 1;
    const startPtr = 2;
    const bytes = 3;
    const count = 4;
    const literal = l.getKey("literal");
    // The nodes are already a flat-packed tree
    // So just loop over the tree brining all of the data forwards over the top of itself
    m.addFunction("_gather", binaryen.createType([binaryen.i32, binaryen.i32]), binaryen.i32, [
        binaryen.i32,
        binaryen.i32,
        binaryen.i32,
    ], m.block(null, [
        m.local.set(startPtr, m.local.get(writePtr, binaryen.i32)),
        // Read node's count
        m.local.set(count, m.i32.const(1)),
        m.block("outer", [
            m.loop("loop", m.block(null, [
                m.if(m.i32.eq(m.i32.load(OFFSET$1.TYPE, 4, m.local.get(nodePtr, binaryen.i32)), m.i32.const(literal.offset)), 
                // If node is literal
                m.block(null, [
                    m.local.set(bytes, m.i32.load(OFFSET$1.COUNT, 4, m.local.get(nodePtr, binaryen.i32))),
                    // Write the data
                    m.call("_memcpy", [
                        m.local.get(writePtr, binaryen.i32),
                        m.i32.add(m.local.get(nodePtr, binaryen.i32), m.i32.const(OFFSET$1.DATA)),
                        m.local.get(bytes, binaryen.i32)
                    ], binaryen.none),
                    // Update the write pointer
                    m.local.set(writePtr, m.i32.add(m.local.get(writePtr, binaryen.i32), m.local.get(bytes, binaryen.i32))),
                    // Jump to the next node
                    m.local.set(nodePtr, m.call("_roundWord", [
                        m.i32.add(m.local.get(nodePtr, binaryen.i32), m.i32.add(m.i32.const(OFFSET$1.DATA), m.local.get(bytes, binaryen.i32)))
                    ], binaryen.i32))
                ]), 
                // If node is something else it will be nested
                m.block(null, [
                    // Add children count to the total number of nodes to be processed
                    m.local.set(count, m.i32.add(m.local.get(count, binaryen.i32), m.i32.load(OFFSET$1.COUNT, 4, m.local.get(nodePtr, binaryen.i32)))),
                    // Step forwards one node
                    m.local.set(nodePtr, m.i32.add(m.local.get(nodePtr, binaryen.i32), m.i32.const(OFFSET$1.DATA)))
                ])),
                m.local.set(count, m.i32.sub(m.local.get(count, binaryen.i32), m.i32.const(1))),
                // Ran out of nodes to consume
                m.br("outer", m.i32.eq(m.local.get(count, binaryen.i32), m.i32.const(0))),
                m.br("loop")
            ]))
        ]),
        m.return(m.i32.sub(m.local.get(writePtr, binaryen.i32), m.local.get(startPtr, binaryen.i32)))
    ]));
}
function GenerateInternals(m, l) {
    GenerateInit(m);
    // GenerateMaxI32(m);
    GenerateRoundWord(m);
    GenerateMemCopy(m);
    GenerateMatchString(m);
    GenerateReachUpdate(m);
    GenerateGather(m, l);
    m.addFunctionExport("_init", "_init");
}
function GenerateWasm(bnf, debug = false) {
    var m = new binaryen.Module();
    m.setFeatures(binaryen.Features.MutableGlobals);
    const fileID = debug
        ? m.addDebugInfoFileName("source.bnf")
        : undefined;
    m.setMemory(1, 1);
    m.addFunctionImport("print_i32", "js", "print_i32", binaryen.createType([binaryen.i32]), binaryen.none);
    const literals = IngestLiterals(m, bnf);
    GenerateInternals(m, literals);
    for (let [_, rule] of bnf.terms) {
        CompileRule$1(m, literals, rule, fileID);
    }
    return m;
}

function CompileExpression(expr, name) {
    switch (expr.constructor.name) {
        case 'Sequence': return CompileSequence(expr, name);
        case 'Select': return CompileSelect(expr);
        case 'Literal': return CompileLiteral(expr);
        case 'Term': return CompileTerm(expr);
        case 'CharRange': return CompileRange();
        case 'Omit': return CompileOmit();
        case 'Not': return CompileNot();
        case 'Gather': return CompileGather();
    }
    throw new Error(`Unexpected expression type ${expr.constructor.name} during compilation`);
}
function CompileSequence(expr, name) {
    const once = CompileSequenceOnce(expr, name);
    if (expr.count === '1') {
        return once;
    }
    else {
        return CompileRepeat(once, expr.count);
    }
}
function CompileSequenceOnce(expr, name) {
    return `{\n\ttype: '${name || '(...)'}',\n\tstart: number,\n\tend: number,\n\tcount: number,\n\tref: _Shared.ReferenceRange,\n\tvalue: [\n` +
        expr.exprs
            .map(x => CompileExpression(x))
            .filter(x => x.length > 0)
            .map(x => '\t\t' + x)
            .join(',\n') +
        '\n\t]\n}';
}
function CompileSelect(expr) {
    const once = CompileSelectOnce(expr);
    if (expr.count === '1') {
        return once;
    }
    else {
        return CompileRepeat(once, expr.count);
    }
}
function CompileSelectOnce(expr) {
    return '(' +
        expr.exprs
            .map(x => CompileExpression(x))
            .filter(x => x.length > 0)
            .join(' | ') +
        ')';
}
function CompileOmit() {
    return '';
}
function CompileGather() {
    return "_Literal";
}
function CompileTerm(expr) {
    const once = CompileTermOnce(expr);
    if (expr.count === '1') {
        return once;
    }
    else {
        return CompileRepeat(once, expr.count);
    }
}
function CompileTermOnce(expr) {
    return 'Term_' + expr.value[0].toUpperCase() + expr.value.slice(1);
}
function CompileNot() {
    return "_Literal";
}
function CompileRange() {
    return "_Literal";
}
function CompileLiteral(expr) {
    const once = CompileLiteralOnce(expr);
    if (expr.count === '1') {
        return once;
    }
    else {
        return CompileRepeat(once, expr.count);
    }
}
function CompileLiteralOnce(expr) {
    let safe = expr.value.replace(/[^a-zA-Z0-9]/g, (char) => '\\x' + char.charCodeAt(0).toString(16).padStart(2, '0'));
    return `_Literal & {value: "${safe}"}`;
}
function CompileRepeat(innerType, repetitions) {
    switch (repetitions) {
        case "1": throw new Error(`Don't compile repetitions for 1 to 1 repetition`);
        case "?": return TemplateNode(`'(...)?'`, `[] | [${innerType}]`);
        case "+": return TemplateNode(`'(...)+'`, `[${innerType}] & Array<${innerType}>`);
        case "*": return TemplateNode(`'(...)*'`, `Array<${innerType}>`);
        default: throw new Error(`Unexpected count type ${repetitions}`);
    }
}
function TemplateNode(type, value) {
    return `{ type: ${type}, value: ${value}, start: number, end: number, count: number, ref: _Shared.ReferenceRange }`;
}
function CompileRule(rule) {
    // Make sure all rules start with a sequence
    let inner = rule.seq;
    if (inner.constructor.name === 'Select') {
        let child = inner;
        if (child.exprs.length === 1)
            child = child.exprs[0];
        inner = new Sequence({
            exprs: [],
            count: '1'
        });
        inner.exprs = [child];
    }
    else if (rule.seq.constructor.name !== 'Sequence') {
        inner = new Sequence({
            exprs: [],
            count: '1'
        });
        inner.exprs = [rule.seq];
    }
    const capName = rule.name[0].toUpperCase() + rule.name.slice(1);
    const typeName = `Term_${capName}`;
    return `export type ${typeName} = ${CompileExpression(inner, rule.name)}\n` +
        `export declare function Parse_${capName} (i: string, refMapping?: boolean): _Shared.ParseError | {\n\troot: _Shared.SyntaxNode & ${typeName},\n\treachBytes: number,\n\treach: null | _Shared.Reference,\n\tisPartial: boolean\n}\n`;
}
function CompileTypes(lang) {
    return `import type * as _Shared from './shared.js';\n` +
        `export type _Literal = { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange };\n` +
        [...lang.terms.keys()]
            .map(x => CompileRule(lang.terms.get(x))) // hush Typescript it's okay
            .join('\n');
}

function FlattenConstant(syntax) {
    let str = "";
    for (let frag of syntax.value[0].value) {
        const inner = frag.value[0];
        switch (inner.type) {
            case "literal":
                str += inner.value;
                break;
            case "byte":
                str += String.fromCharCode(parseInt(inner.value[0].value, 16));
                break;
            case "escape":
                switch (inner.value[0].value) {
                    case "b":
                        str += "\b";
                        break;
                    case "f":
                        str += "\f";
                        break;
                    case "n":
                        str += "\n";
                        break;
                    case "r":
                        str += "\r";
                        break;
                    case "t":
                        str += "\t";
                        break;
                    case "v":
                        str += "\v";
                        break;
                    default: str += inner.value[0].value;
                }
                break;
            default: AssertUnreachable$1();
        }
    }
    return str;
}
function BuildOperand(syntax, namespace) {
    const prefixes = syntax.value[0];
    const component = syntax.value[1];
    let base = {
        type: "constant",
        value: "",
        count: ParseCount(syntax.value[2].value || "1")
    };
    switch (component.type) {
        case "literal":
            if (!namespace.includes(component.value))
                throw new ParseError$1(`Unknown term name "${component.value}"`, component.ref || ReferenceRange$1.blank());
            base.value = component.value;
            base.type = "term";
            break;
        case "constant":
            base.value = FlattenConstant(component);
            base.type = "literal";
            break;
        case "expr_brackets":
            let res = BuildExpr(component.value[0], namespace);
            res.count = base.count;
            base = res;
            break;
        default: AssertUnreachable$1();
    }
    if (prefixes.value[2].value === "!") {
        base = {
            type: "not",
            expr: base,
            count: base.count
        };
        if (!base.expr)
            throw new Error("Typescript please shhhh");
        base.expr.count = "1";
    }
    if (prefixes.value[1].value === "...") {
        base = {
            type: "gather",
            expr: base,
            count: "1"
        };
    }
    if (prefixes.value[0].value === "%") {
        base = {
            type: "omit",
            expr: base,
            count: "1"
        };
    }
    return base;
}
function BuildExpr(syntax, namespace) {
    let base = {
        type: "sequence",
        count: "1",
        exprs: [BuildOperand(syntax.value[0], namespace)]
    };
    for (const pair of syntax.value[1].value) {
        const operand = BuildOperand(pair.value[1], namespace);
        const infix = pair.value[0].value;
        switch (infix) {
            case "": // fall through
            case "|":
                const desire = infix == "|" ? "select" : "sequence";
                if (desire != base.type) {
                    base = {
                        type: desire,
                        count: "1",
                        exprs: [
                            base.type === "sequence" && base.exprs?.length === 1 ? base.exprs[0] : base,
                            operand
                        ]
                    };
                }
                else {
                    base.exprs?.push(operand);
                }
                break;
            case "->":
                const a = base.exprs?.pop();
                if (a?.type != "literal" || operand.type != "literal") {
                    throw new ParseError$1("Attempting to make a range between two non literals", pair.value[0].ref || ReferenceRange$1.blank());
                }
                if (a?.type != "literal" || operand.type != "literal") {
                    throw new ParseError$1("Attempting to make a range non single characters", pair.value[0].ref || ReferenceRange$1.blank());
                }
                if (a?.count != "1") {
                    throw new ParseError$1("Unexpected count on left-hand-side of range", pair.value[0].ref || ReferenceRange$1.blank());
                }
                let action = {
                    type: "range",
                    value: a.value,
                    to: operand.value,
                    count: operand.count
                };
                base.exprs?.push(action);
                break;
            default: throw new ParseError$1(`Unknown operator "${infix}"`, pair.value[0].ref || ReferenceRange$1.blank());
        }
    }
    return base;
}
function CompileDefinition(syntax, namespace) {
    const name = syntax.value[0].value;
    const expr = BuildExpr(syntax.value[1], namespace);
    return new Rule(name, expr, syntax.ref.start);
}
function CompileProgram(syntax) {
    const ctx = new Parser({});
    const defs = syntax.value[0];
    const namespace = defs.value.map(def => def.value[0].value);
    for (const def of defs.value) {
        const rule = CompileDefinition(def, namespace);
        ctx.addRule(rule.name, rule);
    }
    return ctx;
}

function Create(wasm) {
    const mod = new WebAssembly.Module(wasm);
    const bundle = new WebAssembly.Instance(mod, {
        js: {
            print_i32: console.log
        }
    });
    return bundle;
}
function InitParse$1(ctx, data) {
    const memory = ctx.exports.memory;
    const bytesPerPage = 65536;
    // Convert the string to UTF-8 bytes
    const utf8Encoder = new TextEncoder();
    const stringBytes = utf8Encoder.encode(data);
    // ONLY grow memory if needed
    const chunks = Math.ceil(memory.buffer.byteLength / bytesPerPage);
    const desireChunks = Math.ceil(stringBytes.byteLength * 10 / bytesPerPage);
    if (desireChunks > chunks) {
        memory.grow(desireChunks - chunks);
    }
    // Copy the string bytes to WebAssembly memory
    const wasmMemory = new Uint8Array(memory.buffer);
    wasmMemory.set(stringBytes, ctx.exports.input.value);
    ctx.exports.inputLength.value = stringBytes.byteLength;
    return ctx.exports._init();
}
// Cursor utilizes object parse by reference to reduce allocations
function ProgressCursor$1(str, bytes, cursorRef) {
    const encoder = new TextEncoder();
    while (cursorRef.bytes <= bytes && cursorRef.ref.index < str.length) {
        const char = str[cursorRef.ref.index];
        const byteSize = encoder.encode(char).byteLength;
        if (cursorRef.bytes + byteSize > bytes) {
            break;
        }
        cursorRef.ref.advance(char === "\n");
        cursorRef.bytes += byteSize;
    }
}
function MapTreeRefs$1(tree, str, sharedRef) {
    let stack = [tree];
    let cursor = {
        ref: Reference$1.blank(),
        bytes: 0
    };
    while (true) {
        const curr = stack.pop();
        if (!curr)
            break;
        if (curr.ref === sharedRef) {
            // Don't calculate forward progression if not needed
            if (cursor.bytes !== curr.start)
                ProgressCursor$1(str, curr.start, cursor);
            curr.ref = new ReferenceRange$1(cursor.ref.clone(), cursor.ref // no alloc fill in
            );
            stack.push(curr); // revisit node for ref.end mapping (after children)
            if (typeof (curr.value) !== "string") {
                // Reverse order concat children to stack for FIFO
                for (let i = curr.value.length - 1; i >= 0; i--) {
                    stack.push(curr.value[i]);
                }
            }
        }
        else {
            // Don't calculate forward progression if not needed
            if (cursor.bytes !== curr.end)
                ProgressCursor$1(str, curr.end, cursor);
            curr.ref.end = cursor.ref.clone();
            curr.ref.end.advance(false); // end ref refers to the index after the final char
        }
    }
}
function Parse$1(ctx, data, refMapping = true, entry = "program") {
    const heap = InitParse$1(ctx, data);
    const statusCode = ctx.exports[entry]();
    let reach = Number(ctx.exports.reach);
    if (statusCode == 1) {
        if (refMapping) {
            const cursor = { bytes: 0, ref: Reference$1.blank() };
            ProgressCursor$1(data, reach, cursor);
            return new ParseError$1("Unable to parse", new ReferenceRange$1(new Reference$1(0, 0, 0), cursor.ref));
        }
        else {
            return new ParseError$1("Unable to parse", new ReferenceRange$1(new Reference$1(0, 0, 0), new Reference$1(0, 0, reach)));
        }
    }
    const sharedRef = new ReferenceRange$1(new Reference$1(0, 0, 0), new Reference$1(0, 0, 0));
    const root = Decode$1(ctx, heap, sharedRef);
    if (refMapping) {
        MapTreeRefs$1(root, data, sharedRef);
    }
    let reachRef = null;
    if (refMapping) {
        const cursor = { bytes: 0, ref: root.ref.end.clone() };
        ProgressCursor$1(data, reach, cursor);
        reachRef = cursor.ref;
    }
    return {
        reachBytes: reach,
        isPartial: root.end < ctx.exports.inputLength.value,
        reach: reachRef,
        root,
    };
}
function Decode$1(ctx, heap, sharedRef) {
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
        const type_ptr = memoryArray.at(offset + OFFSET$1.TYPE / 4) || 0;
        let type = typeCache.get(type_ptr);
        if (!type) {
            const type_len = memoryArray.at(offset + OFFSET$1.TYPE_LEN / 4) || 0;
            type = decoder.decode(byteArray.slice(type_ptr, type_ptr + type_len));
            typeCache.set(type_ptr, type);
        }
        const next = new SyntaxNode$2(type, memoryArray.at(offset + OFFSET$1.START / 4) || 0, memoryArray.at(offset + OFFSET$1.END / 4) || 0, memoryArray.at(offset + OFFSET$1.COUNT / 4) || 0, sharedRef);
        offset += OFFSET$1.DATA / 4;
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
function toString() {
    return (`const OFFSET = ${JSON.stringify(OFFSET$1)};` +
        "\nexport " + InitParse$1.toString() +
        "\nexport " + ProgressCursor$1.toString() +
        "\nexport " + MapTreeRefs$1.toString() +
        "\nexport " + Parse$1.toString() +
        "\nexport " + Decode$1.toString() + "\n\n").replace(/    /gm, "\t").replace(/\r\n/gm, "\n");
}

var run = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Create: Create,
    Parse: Parse$1,
    toString: toString
});

const OFFSET = {"TYPE":0,"TYPE_LEN":4,"START":8,"END":12,"COUNT":16,"DATA":20};
function InitParse(ctx, data) {
	const memory = ctx.exports.memory;
	const bytesPerPage = 65536;
	// Convert the string to UTF-8 bytes
	const utf8Encoder = new TextEncoder();
	const stringBytes = utf8Encoder.encode(data);
	// ONLY grow memory if needed
	const chunks = Math.ceil(memory.buffer.byteLength / bytesPerPage);
	const desireChunks = Math.ceil(stringBytes.byteLength * 10 / bytesPerPage);
	if (desireChunks > chunks) {
		memory.grow(desireChunks - chunks);
	}
	// Copy the string bytes to WebAssembly memory
	const wasmMemory = new Uint8Array(memory.buffer);
	wasmMemory.set(stringBytes, ctx.exports.input.value);
	ctx.exports.inputLength.value = stringBytes.byteLength;
	return ctx.exports._init();
}
function ProgressCursor(str, bytes, cursorRef) {
	const encoder = new TextEncoder();
	while (cursorRef.bytes <= bytes && cursorRef.ref.index < str.length) {
		const char = str[cursorRef.ref.index];
		const byteSize = encoder.encode(char).byteLength;
		if (cursorRef.bytes + byteSize > bytes) {
			break;
		}
		cursorRef.ref.advance(char === "\n");
		cursorRef.bytes += byteSize;
	}
}
function MapTreeRefs(tree, str, sharedRef) {
	let stack = [tree];
	let cursor = {
		ref: Reference.blank(),
		bytes: 0
	};
	while (true) {
		const curr = stack.pop();
		if (!curr)
			break;
		if (curr.ref === sharedRef) {
			// Don't calculate forward progression if not needed
			if (cursor.bytes !== curr.start)
				ProgressCursor(str, curr.start, cursor);
			curr.ref = new ReferenceRange(cursor.ref.clone(), cursor.ref // no alloc fill in
			);
			stack.push(curr); // revisit node for ref.end mapping (after children)
			if (typeof (curr.value) !== "string") {
				// Reverse order concat children to stack for FIFO
				for (let i = curr.value.length - 1; i >= 0; i--) {
					stack.push(curr.value[i]);
				}
			}
		}
		else {
			// Don't calculate forward progression if not needed
			if (cursor.bytes !== curr.end)
				ProgressCursor(str, curr.end, cursor);
			curr.ref.end = cursor.ref.clone();
			curr.ref.end.advance(false); // end ref refers to the index after the final char
		}
	}
}
function Parse(ctx, data, refMapping = true, entry = "program") {
	const heap = InitParse(ctx, data);
	const statusCode = ctx.exports[entry]();
	let reach = Number(ctx.exports.reach);
	if (statusCode == 1) {
		if (refMapping) {
			const cursor = { bytes: 0, ref: Reference.blank() };
			ProgressCursor(data, reach, cursor);
			return new ParseError("Unable to parse", new ReferenceRange(new Reference(0, 0, 0), cursor.ref));
		}
		else {
			return new ParseError("Unable to parse", new ReferenceRange(new Reference(0, 0, 0), new Reference(0, 0, reach)));
		}
	}
	const sharedRef = new ReferenceRange(new Reference(0, 0, 0), new Reference(0, 0, 0));
	const root = Decode(ctx, heap, sharedRef);
	if (refMapping) {
		MapTreeRefs(root, data, sharedRef);
	}
	let reachRef = null;
	if (refMapping) {
		const cursor = { bytes: 0, ref: root.ref.end.clone() };
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
function Decode(ctx, heap, sharedRef) {
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
		if (!type) {
			const type_len = memoryArray.at(offset + OFFSET.TYPE_LEN / 4) || 0;
			type = decoder.decode(byteArray.slice(type_ptr, type_ptr + type_len));
			typeCache.set(type_ptr, type);
		}
		const next = new SyntaxNode(type, memoryArray.at(offset + OFFSET.START / 4) || 0, memoryArray.at(offset + OFFSET.END / 4) || 0, memoryArray.at(offset + OFFSET.COUNT / 4) || 0, sharedRef);
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

class ParseError {
	stack;
	msg;
	ref;
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
class SyntaxNode {
	type;
	start;
	end;
	count;
	value;
	ref;
	constructor(type, start, end, count, ref) {
		this.type = type;
		this.start = start;
		this.end = end;
		this.count = count;
		this.value = [];
		this.ref = ref;
	}
}
class Reference {
	line;
	col;
	index;
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
	static blank() {
		return new Reference(1, 1, 0);
	}
}
class ReferenceRange {
	start;
	end;
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
	static union(a, b) {
		return new ReferenceRange(a.start.index < b.start.index ? a.start.clone() : b.start.clone(), // Smallest
		a.end.index > b.end.index ? a.end.clone() : b.end.clone());
	}
	static intersection(a, b) {
		let start = a.start.index > b.start.index ? a.start.clone() : b.start.clone(); // Largest
		let end = a.end.index < b.end.index ? a.end.clone() : b.end.clone(); // Smallest
		return new ReferenceRange(
		// Make sure start and end haven't switched
		start.index > end.index ? start : end, start.index > end.index ? end : start);
	}
	static blank() {
		return new ReferenceRange(Reference.blank(), Reference.blank());
	}
}
function AssertUnreachable(x) {
	throw new Error("Unreachable code path reachable");
}
function DecodeBase64(base64) {
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

var shared = /*#__PURE__*/Object.freeze({
    __proto__: null,
    AssertUnreachable: AssertUnreachable,
    Decode: Decode,
    DecodeBase64: DecodeBase64,
    InitParse: InitParse,
    MapTreeRefs: MapTreeRefs,
    Parse: Parse,
    ParseError: ParseError,
    ProgressCursor: ProgressCursor,
    Reference: Reference,
    ReferenceRange: ReferenceRange,
    SyntaxNode: SyntaxNode
});

let _rawWasm = DecodeBase64("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");
let _ctx = null;
if (typeof window === 'undefined') {
	_ctx = new WebAssembly.Instance(
		new WebAssembly.Module(
			_rawWasm
		), {js: {print_i32: console.log}}
	);
}
let ready = new Promise(async (res) => {
	if (typeof window !== 'undefined') {
		_ctx = await WebAssembly.instantiate(
			await WebAssembly.compile(_rawWasm),
			{js: {print_i32: console.log}}
		);
	}

	Object.freeze(_ctx);
	_rawWasm = null;
	res();
});
function Parse_Program (data, refMapping = true) {
	return Parse(_ctx, data, refMapping, "program");
}
function Parse_W (data, refMapping = true) {
	return Parse(_ctx, data, refMapping, "w");
}
function Parse_Comment (data, refMapping = true) {
	return Parse(_ctx, data, refMapping, "comment");
}
function Parse_Name (data, refMapping = true) {
	return Parse(_ctx, data, refMapping, "name");
}
function Parse_Letter (data, refMapping = true) {
	return Parse(_ctx, data, refMapping, "letter");
}
function Parse_Digit (data, refMapping = true) {
	return Parse(_ctx, data, refMapping, "digit");
}
function Parse_Hex (data, refMapping = true) {
	return Parse(_ctx, data, refMapping, "hex");
}
function Parse_Constant (data, refMapping = true) {
	return Parse(_ctx, data, refMapping, "constant");
}
function Parse_Frag (data, refMapping = true) {
	return Parse(_ctx, data, refMapping, "frag");
}
function Parse_Escape (data, refMapping = true) {
	return Parse(_ctx, data, refMapping, "escape");
}
function Parse_Byte (data, refMapping = true) {
	return Parse(_ctx, data, refMapping, "byte");
}
function Parse_Def (data, refMapping = true) {
	return Parse(_ctx, data, refMapping, "def");
}
function Parse_Expr (data, refMapping = true) {
	return Parse(_ctx, data, refMapping, "expr");
}
function Parse_Expr_arg (data, refMapping = true) {
	return Parse(_ctx, data, refMapping, "expr_arg");
}
function Parse_Expr_prefix (data, refMapping = true) {
	return Parse(_ctx, data, refMapping, "expr_prefix");
}
function Parse_Expr_infix (data, refMapping = true) {
	return Parse(_ctx, data, refMapping, "expr_infix");
}
function Parse_Expr_suffix (data, refMapping = true) {
	return Parse(_ctx, data, refMapping, "expr_suffix");
}
function Parse_Expr_brackets (data, refMapping = true) {
	return Parse(_ctx, data, refMapping, "expr_brackets");
}

var bnf = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Parse_Byte: Parse_Byte,
    Parse_Comment: Parse_Comment,
    Parse_Constant: Parse_Constant,
    Parse_Def: Parse_Def,
    Parse_Digit: Parse_Digit,
    Parse_Escape: Parse_Escape,
    Parse_Expr: Parse_Expr,
    Parse_Expr_arg: Parse_Expr_arg,
    Parse_Expr_brackets: Parse_Expr_brackets,
    Parse_Expr_infix: Parse_Expr_infix,
    Parse_Expr_prefix: Parse_Expr_prefix,
    Parse_Expr_suffix: Parse_Expr_suffix,
    Parse_Frag: Parse_Frag,
    Parse_Hex: Parse_Hex,
    Parse_Letter: Parse_Letter,
    Parse_Name: Parse_Name,
    Parse_Program: Parse_Program,
    Parse_W: Parse_W,
    ready: ready
});

function Compile2Wasm(inputBnf) {
    const syntax = Parse_Program(inputBnf, true);
    if (syntax instanceof ParseError) {
        const convert = new ParseError$1(syntax.msg, syntax.ref);
        convert.stack = syntax.stack;
        return convert;
    }
    if (syntax.isPartial) {
        return new ParseError$1("Unexpected syntax at", new ReferenceRange$1(syntax.root.ref?.end || new Reference$1(0, 0, 0), new Reference$1(0, 0, syntax.reachBytes)));
    }
    try {
        const lang = CompileProgram(syntax.root);
        return GenerateWasm(lang);
    }
    catch (e) {
        if (e instanceof ParseError$1)
            return e;
        throw e;
    }
}

var index = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Compile2Wasm: Compile2Wasm,
    CompileTypes: CompileTypes,
    GenerateWasm: GenerateWasm,
    Runner: run
});

export { shared as _shared, bnf, index as wasm };
