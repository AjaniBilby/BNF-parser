import * as _Shared from "./shared.js";
export type Term_Program = {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: Term_Def[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function program (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Program, reachBytes: number, inputBytes: number }

export type Term_W = {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    (Term_Comment | { type: "literal", value: "\x20", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x09", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x0a", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x0d", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })
  ]
}
export declare function w (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_W, reachBytes: number, inputBytes: number }

export type Term_Comment = {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: "\x23", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "literal", value: "\x0a", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function comment (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Comment, reachBytes: number, inputBytes: number }

export type Term_Name = {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Letter,
    { type: "(...)", value: (Term_Letter | Term_Digit | { type: "literal", value: "\x5f", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
  ]
}
export declare function name (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Name, reachBytes: number, inputBytes: number }

export type Term_Letter = {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })
  ]
}
export declare function letter (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Letter, reachBytes: number, inputBytes: number }

export type Term_Digit = {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function digit (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Digit, reachBytes: number, inputBytes: number }

export type Term_Hex = {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })
  ]
}
export declare function hex (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Hex, reachBytes: number, inputBytes: number }

export type Term_Constant = {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: Term_Frag[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function constant (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Constant, reachBytes: number, inputBytes: number }

export type Term_Frag = {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    (Term_Escape | { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })
  ]
}
export declare function frag (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Frag, reachBytes: number, inputBytes: number }

export type Term_Escape = {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function escape (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Escape, reachBytes: number, inputBytes: number }

export type Term_Byte = {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function byte (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Byte, reachBytes: number, inputBytes: number }

export type Term_Def = {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    Term_Expr
  ]
}
export declare function def (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Def, reachBytes: number, inputBytes: number }

export type Term_Expr = {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Expr_arg,
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    Term_Expr_arg
  ]
}[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function expr (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr, reachBytes: number, inputBytes: number }

export type Term_Expr_arg = {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Expr_prefix,
    ({ type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | Term_Expr_brackets | { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }),
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function expr_arg (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_arg, reachBytes: number, inputBytes: number }

export type Term_Expr_prefix = {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function expr_prefix (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_prefix, reachBytes: number, inputBytes: number }

export type Term_Expr_infix = {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: "\x2d\x3e", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x7c", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })
  ]
}
export declare function expr_infix (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_infix, reachBytes: number, inputBytes: number }

export type Term_Expr_suffix = {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: "\x2a", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x3f", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x2b", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })
  ]
}
export declare function expr_suffix (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_suffix, reachBytes: number, inputBytes: number }

export type Term_Expr_brackets = {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Expr
  ]
}
export declare function expr_brackets (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_brackets, reachBytes: number, inputBytes: number }
