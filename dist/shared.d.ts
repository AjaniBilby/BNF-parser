export declare class ParseError {
    stack: string[];
    msg: string;
    ref: ReferenceRange;
    constructor(msg: string, ref: ReferenceRange);
    add_stack(elm: string): void;
    hasStack(): boolean;
    toString(): string;
}
export declare class SyntaxNode {
    type: string;
    start: number;
    end: number;
    count: number;
    value: SyntaxNode[] | string;
    ref: null | ReferenceRange;
    constructor(type: string, start: number, end: number, count: number);
}
export declare class Reference {
    line: number;
    col: number;
    index: number;
    constructor(line: number, col: number, index: number);
    advance(newline?: boolean): void;
    valueOf(): number;
    clone(): Reference;
    toString(): string;
    static blank(): Reference;
}
export declare class ReferenceRange {
    start: Reference;
    end: Reference;
    constructor(from: Reference, to: Reference);
    span(other: ReferenceRange): void;
    valueOf(): number;
    clone(): ReferenceRange;
    toString(): string;
    static blank(): ReferenceRange;
}
export declare function DecodeBase64(base64: string): Uint8Array;
