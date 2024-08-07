import binaryen from 'https://unpkg.com/binaryen@113.0.0/index.js';

let ParseError$1 = class ParseError {
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
    constructor(json) {
        this.value = json['value'];
        this.count = ParseCount(json['count']);
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
    constructor(json) {
        this.expr = ParseExpression(json['expr']);
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
    constructor(json) {
        this.expr = ParseExpression(json['expr']);
        this.count = ParseCount(json['count']);
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
    constructor(json) {
        this.value = json['value'];
        this.count = ParseCount(json['count']);
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
        out.reach = (err === null || err === void 0 ? void 0 : err.ref) || null;
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
    constructor(json) {
        this.exprs = [];
        this.count = ParseCount(json['count']);
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
    constructor(name, json) {
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
        var _a;
        for (let key of this.terms.keys()) {
            (_a = this.terms.get(key)) === null || _a === void 0 ? void 0 : _a.setVerbose(mode);
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

function BuildRule(rule) {
    if (rule.type != "def") {
        throw new Error(`Unknown internal error, expected "def" got "${rule.type}"`);
    }
    return new Rule(rule.value[0].value, BuildExpr$1(rule.value[1]));
}
function BuildExpr$1(expr) {
    var _a;
    if (expr.type != "expr") {
        throw new Error(`Unknown internal error, expected "expr" got "${expr.type}"`);
    }
    let base = {
        type: "sequence",
        count: "1",
        exprs: [BuildOperand$1(expr.value[0])]
    };
    for (let pair of expr.value[1].value) {
        let operator = pair.value[0];
        let operand = BuildOperand$1(pair.value[1]);
        switch (operator.value) {
            case "":
            case "|":
                let desire = operator.value == "|" ? "select" : "sequence";
                if (base.type != desire) {
                    if (base.type == "range" || ((_a = base.exprs) === null || _a === void 0 ? void 0 : _a.length) != 1) {
                        base = {
                            type: desire,
                            count: "1",
                            exprs: [base, operand]
                        };
                        continue;
                    }
                    else {
                        base.type = desire;
                        base.exprs.push(operand);
                        continue;
                    }
                }
                base.exprs.push(operand);
                continue;
            case "->":
                let a = base.exprs.pop();
                if (a.type != "literal" || operand.type != "literal") {
                    throw new Error(`Attempting to make a range between two non literals at ${operator.ref.toString()}`);
                }
                if (a.value.length != 1 || operand.value.length != 1) {
                    throw new Error(`Attempting to make a range non single characters at ${operator.ref.toString()}`);
                }
                let action = {
                    type: "range",
                    value: a.value,
                    to: operand.value,
                    count: operand.count
                };
                if (base.exprs.length == 0) {
                    base = action;
                }
                else {
                    base.exprs.push(action);
                }
                continue;
            default:
                throw new Error(`Unknown operator "${operator.value}"`);
        }
    }
    return base;
}
function FlatternConstant(expr) {
    if (expr.type != "constant") {
        throw new Error(`Unknown internal error, expected "constant" got "${expr.type}"`);
    }
    let str = expr.value[0];
    let inner = str.value[0];
    let out = "";
    if (!Array.isArray(inner.value)) {
        throw new TypeError("Internal logic failure. Unexpected string");
    }
    for (let charNode of inner.value) {
        if (charNode.type == "literal") {
            out += charNode.value;
        }
        else {
            let esc = charNode.value;
            switch (esc[1].value) {
                case "b":
                    out += "\b";
                    break;
                case "f":
                    out += "\f";
                    break;
                case "n":
                    out += "\n";
                    break;
                case "r":
                    out += "\r";
                    break;
                case "t":
                    out += "\t";
                    break;
                case "v":
                    out += "\v";
                    break;
                default: out += esc[1].value;
            }
        }
    }
    return out;
}
function BuildOperand$1(expr) {
    if (expr.type != "expr_arg") {
        throw new Error(`Unknown internal error, expected "expr_arg" got "${expr.type}"`);
    }
    let component = expr.value;
    let prefixes = component[0].value;
    let countStr = component[2].value;
    let base = {
        count: ParseCount(countStr == "" ? "1" : countStr)
    };
    switch (component[1].type) {
        case "constant":
            component[1].value = FlatternConstant(component[1]);
        case "name":
            base.type = component[1].type == "constant" ? "literal" : "term";
            base.value = component[1].value;
            break;
        case "expr_brackets":
            let res = BuildExpr$1(component[1].value[0]);
            res.count = base.count;
            base = res;
            break;
        default:
            throw new Error(`Unknown operand type ${component[1].type}`);
    }
    if (prefixes[2].value == "!") {
        base = {
            type: "not",
            expr: base,
            count: base.count
        };
        base.expr.count = "1";
    }
    if (prefixes[1].value == "...") {
        base = {
            type: "gather",
            expr: base
        };
    }
    if (prefixes[0].value == "%") {
        base = {
            type: "omit",
            expr: base
        };
    }
    return base;
}
function Compile(tree) {
    if (!(tree instanceof SyntaxNode$1)) {
        throw new TypeError("Cannot compile syntax tree, as Syntax node is not provided");
    }
    let syntax = new Parser({});
    for (let node of tree.value[0].value) {
        if (node instanceof SyntaxNode$1 &&
            node.value[0] instanceof SyntaxNode$1) {
            let rule = BuildRule(node.value[0]);
            syntax.addRule(rule.name, rule);
        }
        else {
            throw new Error("Malformed syntax tree");
        }
    }
    return syntax;
}

const bnf_json={"program":{"type":"sequence","count":"1","exprs":[{"type":"omit","expr":{"type":"term","value":"w","count":"*"}},{"type":"sequence","count":"+","exprs":[{"type":"term","value":"def","count":"1"},{"type":"omit","expr":{"type":"term","value":"w","count":"*"}}]}]},"any":{"type":"sequence","count":"1","exprs":[{"type":"not","count":"1","expr":{"type":"literal","value":"","count":"1"}}]},"w":{"type":"select","count":"1","exprs":[{"type":"term","value":"comment","count":"1"},{"type":"literal","value":" ","count":"1"},{"type":"literal","value":"\t","count":"1"},{"type":"literal","value":"\n","count":"1"},{"type":"literal","value":"\r","count":"1"}]},"comment":{"type":"sequence","count":"1","exprs":[{"type":"literal","value":"#","count":"1"},{"type":"not","count":"*","expr":{"type":"literal","value":"\n","count":"1"}},{"type":"literal","value":"\n","count":"1"}]},"name":{"type":"sequence","count":"1","exprs":[{"type":"gather","expr":{"type":"select","count":"+","exprs":[{"type":"term","value":"letter","count":"1"},{"type":"term","value":"digit","count":"1"},{"type":"literal","value":"_","count":"1"}]}}]},"letter":{"type":"select","count":"1","exprs":[{"type":"range","value":"a","count":"1","to":"z"},{"type":"range","value":"A","count":"1","to":"Z"}]},"digit":{"type":"range","value":"0","count":"1","to":"9"},"constant":{"type":"select","count":"1","exprs":[{"type":"term","value":"single","count":"1"},{"type":"term","value":"double","count":"1"}]},"double":{"type":"sequence","count":"1","exprs":[{"type":"omit","expr":{"type":"literal","value":"\"","count":"1"}},{"type":"select","count":"*","exprs":[{"type":"sequence","count":"1","exprs":[{"type":"literal","value":"\\","count":"1"},{"type":"gather","expr":{"type":"term","value":"any","count":"1"}}]},{"type":"not","count":"+","expr":{"type":"literal","value":"\"","count":"1"}}]},{"type":"omit","expr":{"type":"literal","value":"\"","count":"1"}}]},"single":{"type":"sequence","count":"1","exprs":[{"type":"omit","expr":{"type":"literal","value":"'","count":"1"}},{"type":"select","count":"*","exprs":[{"type":"sequence","count":"1","exprs":[{"type":"literal","value":"\\","count":"1"},{"type":"gather","expr":{"type":"term","value":"any","count":"1"}}]},{"type":"not","count":"+","expr":{"type":"literal","value":"'","count":"1"}}]},{"type":"omit","expr":{"type":"literal","value":"'","count":"1"}}]},"def":{"type":"sequence","count":"1","exprs":[{"type":"gather","expr":{"type":"term","value":"name","count":"1"}},{"type":"omit","expr":{"type":"term","value":"w","count":"+"}},{"type":"omit","expr":{"type":"literal","value":"::=","count":"1"}},{"type":"omit","expr":{"type":"term","value":"w","count":"*"}},{"type":"term","value":"expr","count":"1"},{"type":"omit","expr":{"type":"term","value":"w","count":"*"}},{"type":"omit","expr":{"type":"literal","value":";","count":"1"}}]},"expr":{"type":"sequence","count":"1","exprs":[{"type":"term","value":"expr_arg","count":"1"},{"type":"omit","expr":{"type":"term","value":"w","count":"*"}},{"type":"sequence","count":"*","exprs":[{"type":"gather","expr":{"type":"term","value":"expr_infix","count":"?"}},{"type":"omit","expr":{"type":"term","value":"w","count":"*"}},{"type":"term","value":"expr_arg","count":"1"},{"type":"omit","expr":{"type":"term","value":"w","count":"*"}}]}]},"expr_arg":{"type":"sequence","count":"1","exprs":[{"type":"term","value":"expr_prefix","count":"1"},{"type":"select","count":"1","exprs":[{"type":"term","value":"constant","count":"1"},{"type":"term","value":"expr_brackets","count":"1"},{"type":"gather","expr":{"type":"term","value":"name","count":"1"}}]},{"type":"gather","expr":{"type":"term","value":"expr_suffix","count":"?"}}]},"expr_prefix":{"type":"sequence","count":"1","exprs":[{"type":"literal","value":"%","count":"?"},{"type":"literal","value":"...","count":"?"},{"type":"literal","value":"!","count":"?"}]},"expr_infix":{"type":"select","count":"1","exprs":[{"type":"literal","value":"->","count":"1"},{"type":"literal","value":"|","count":"1"}]},"expr_suffix":{"type":"select","count":"1","exprs":[{"type":"literal","value":"*","count":"1"},{"type":"literal","value":"?","count":"1"},{"type":"literal","value":"+","count":"1"}]},"expr_brackets":{"type":"sequence","count":"1","exprs":[{"type":"omit","expr":{"type":"literal","value":"(","count":"1"}},{"type":"omit","expr":{"type":"term","value":"w","count":"*"}},{"type":"term","value":"expr","count":"1"},{"type":"omit","expr":{"type":"term","value":"w","count":"*"}},{"type":"omit","expr":{"type":"literal","value":")","count":"1"}}]}};

const BNF = new Parser(bnf_json);
const helper = {
    Compile: (bnf) => {
        const syntax = BNF.parse(bnf);
        if (syntax instanceof ParseError$1)
            return syntax;
        return Compile(syntax);
    }
};

var index$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    BNF: BNF,
    Compile: Compile,
    ParseError: ParseError$1,
    Parser: Parser,
    Reference: Reference$1,
    ReferenceRange: ReferenceRange$1,
    SyntaxNode: SyntaxNode$1,
    helper: helper
});

// Using a class for better V8 performance
class Mapping {
    constructor(value, bytes, offset) {
        this.value = value;
        this.bytes = bytes;
        this.offset = offset;
        Object.freeze(this);
    }
}
class LiteralMapping {
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
// Using OO because of better V8 memory optimisations
class CompilerContext {
    constructor(m, literals, rule) {
        this.m = m;
        this.l = literals;
        this.vars = [];
        this._blocks = [];
        this._bID = 1;
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
}
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
    return ctx.m.block(null, [
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
    return ctx.m.block(null, body);
}
function CompileOmit$1(ctx, expr) {
    const rewind = ctx.declareVar(binaryen.i32);
    return ctx.m.block(null, [
        ctx.m.local.set(rewind, ctx.m.global.get("heap", binaryen.i32)),
        CompileExpression$1(ctx, expr.expr),
        ctx.m.global.set("heap", ctx.m.local.get(rewind, binaryen.i32)),
    ]);
}
function CompileGather$1(ctx, expr) {
    const error = SHARED.ERROR;
    const rewind = ctx.declareVar(binaryen.i32);
    const literal = ctx.l.getKey("literal");
    return ctx.m.block(null, [
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
    return ctx.m.block(null, [
        ctx.m.local.set(rewind, ctx.m.global.get("heap", binaryen.i32)),
        // Forward processing to child
        ctx.m.local.set(error, ctx.m.call(expr.value, [], binaryen.i32))
    ]);
}
function CompileNot$1(ctx, expr) {
    const error = SHARED.ERROR;
    const rewind = ctx.declareVar(binaryen.i32);
    const count = ctx.declareVar(binaryen.i32);
    const literal = ctx.l.getKey("literal");
    const outer = ctx.reserveBlock();
    const block = ctx.reserveBlock();
    const loop = ctx.reserveBlock();
    return ctx.m.block(outer, [
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
}
function CompileRange$1(ctx, expr) {
    const error = SHARED.ERROR;
    const rewind = ctx.declareVar(binaryen.i32);
    const count = ctx.declareVar(binaryen.i32);
    const literal = ctx.l.getKey("literal");
    const outer = ctx.reserveBlock();
    const block = ctx.reserveBlock();
    const loop = ctx.reserveBlock();
    return ctx.m.block(outer, [
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
    return ctx.m.block(block, [
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
function CompileRule$1(m, literals, rule) {
    const ctx = new CompilerContext(m, literals, rule);
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
    ctx.m.addFunction(rule.name, binaryen.createType([]), binaryen.i32, ctx.vars, ctx.m.block(null, [
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
    ]));
    ctx.m.addFunctionExport(rule.name, rule.name);
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
    m.addGlobal("inputEnd", binaryen.i32, true, m.i32.const(0));
    m.addGlobal("inputLength", binaryen.i32, true, m.i32.const(0));
    m.addGlobal("heap", binaryen.i32, true, m.i32.const(0));
    m.addGlobal("index", binaryen.i32, true, m.i32.const(0));
    m.addGlobal("reach", binaryen.i32, true, m.i32.const(0));
    m.addGlobalExport("input", "input");
    m.addGlobalExport("reach", "reach");
    m.addGlobalExport("inputLength", "inputLength");
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
function GenerateWasm(bnf) {
    var m = new binaryen.Module();
    m.setFeatures(binaryen.Features.MutableGlobals);
    m.setMemory(1, 1);
    m.addFunctionImport("print_i32", "js", "print_i32", binaryen.createType([binaryen.i32]), binaryen.none);
    const literals = IngestLiterals(m, bnf);
    GenerateInternals(m, literals);
    for (let [_, rule] of bnf.terms) {
        CompileRule$1(m, literals, rule);
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
            case "unicode":
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
    var _a, _b, _c, _d;
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
                            base.type === "sequence" && ((_a = base.exprs) === null || _a === void 0 ? void 0 : _a.length) === 1 ? base.exprs[0] : base,
                            operand
                        ]
                    };
                }
                else {
                    (_b = base.exprs) === null || _b === void 0 ? void 0 : _b.push(operand);
                }
                break;
            case "->":
                const a = (_c = base.exprs) === null || _c === void 0 ? void 0 : _c.pop();
                if ((a === null || a === void 0 ? void 0 : a.type) != "literal" || operand.type != "literal") {
                    throw new ParseError$1("Attempting to make a range between two non literals", pair.value[0].ref || ReferenceRange$1.blank());
                }
                if ((a === null || a === void 0 ? void 0 : a.type) != "literal" || operand.type != "literal") {
                    throw new ParseError$1("Attempting to make a range non single characters", pair.value[0].ref || ReferenceRange$1.blank());
                }
                if ((a === null || a === void 0 ? void 0 : a.count) != "1") {
                    throw new ParseError$1("Unexpected count on left-hand-side of range", pair.value[0].ref || ReferenceRange$1.blank());
                }
                let action = {
                    type: "range",
                    value: a.value,
                    to: operand.value,
                    count: operand.count
                };
                (_d = base.exprs) === null || _d === void 0 ? void 0 : _d.push(action);
                break;
            default: throw new ParseError$1(`Unknown operator "${infix}"`, pair.value[0].ref || ReferenceRange$1.blank());
        }
    }
    return base;
}
function CompileDefinition(syntax, namespace) {
    const name = syntax.value[0].value;
    const expr = BuildExpr(syntax.value[1], namespace);
    return new Rule(name, expr);
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
function Parse_Unicode (data, refMapping = true) {
	return Parse(_ctx, data, refMapping, "unicode");
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
    Parse_Unicode: Parse_Unicode,
    Parse_W: Parse_W,
    ready: ready
});

function Compile2Wasm(inputBnf) {
    var _a;
    const syntax = Parse_Program(inputBnf, true);
    if (syntax instanceof ParseError) {
        const convert = new ParseError$1(syntax.msg, syntax.ref);
        convert.stack = syntax.stack;
        return convert;
    }
    if (syntax.isPartial) {
        return new ParseError$1("Unexpected syntax at", new ReferenceRange$1(((_a = syntax.root.ref) === null || _a === void 0 ? void 0 : _a.end) || new Reference$1(0, 0, 0), new Reference$1(0, 0, syntax.reachBytes)));
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

export { shared as _shared, bnf, index$1 as legacy, index as wasm };
