import * as _Shared from "./shared.js";
export type Term_Attribute = {
  type: "attribute", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }),
    { type: "(...)", value: [] | [Term_Jsonpath], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "(...)", value: [] | [Term_Castormodifiers], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function attribute (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Attribute, reachBytes: number, isPartial: boolean }

export type Term_Partialjsonpath = {
  type: "partialjsonpath", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }),
    { type: "(...)", value: [] | [Term_Jsonpath], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "(...)", value: [] | [Term_Castormodifiers], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function partialjsonpath (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Partialjsonpath, reachBytes: number, isPartial: boolean }

export type Term_Identifier = {
  type: "identifier", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: ({ type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | Term_Digit | { type: "literal", value: "\x5f", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function identifier (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Identifier, reachBytes: number, isPartial: boolean }

export type Term_Digit = {
  type: "digit", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function digit (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Digit, reachBytes: number, isPartial: boolean }

export type Term_Number = {
  type: "number", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function number (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Number, reachBytes: number, isPartial: boolean }

export type Term_Association = {
  type: "association", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Identifier,
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: "\x2e", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    Term_Identifier
  ]
}[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function association (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Association, reachBytes: number, isPartial: boolean }

export type Term_Jsonpath = {
  type: "jsonpath", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: ({ type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function jsonpath (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Jsonpath, reachBytes: number, isPartial: boolean }

export type Term_Indexaccess = {
  type: "indexaccess", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Number
  ]
}
export declare function indexaccess (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Indexaccess, reachBytes: number, isPartial: boolean }

export type Term_Keyaccess = {
  type: "keyaccess", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Key
  ]
}
export declare function keyaccess (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Keyaccess, reachBytes: number, isPartial: boolean }

export type Term_Nonemptystring = {
  type: "nonemptystring", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function nonemptystring (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Nonemptystring, reachBytes: number, isPartial: boolean }

export type Term_Key = {
  type: "key", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    (Term_Nonemptystring | { type: "(...)", value: ({ type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | Term_Digit | { type: "literal", value: "\x5f", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x2d", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })
  ]
}
export declare function key (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Key, reachBytes: number, isPartial: boolean }

export type Term_Escapedcharacter = {
  type: "escapedcharacter", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: "\x5c", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x5c\x5c", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })
  ]
}
export declare function escapedcharacter (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Escapedcharacter, reachBytes: number, isPartial: boolean }

export type Term_Any = {
  type: "any", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function any (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Any, reachBytes: number, isPartial: boolean }

export type Term_Anyexceptquoteorbackslash = {
  type: "anyexceptquoteorbackslash", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function anyexceptquoteorbackslash (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Anyexceptquoteorbackslash, reachBytes: number, isPartial: boolean }

export type Term_Castormodifiers = {
  type: "castormodifiers", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: ({ type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function castormodifiers (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Castormodifiers, reachBytes: number, isPartial: boolean }

export type Term_Cast = {
  type: "cast", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Identifier
  ]
}
export declare function cast (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Cast, reachBytes: number, isPartial: boolean }

export type Term_Modifier = {
  type: "modifier", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Identifier
  ]
}
export declare function modifier (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Modifier, reachBytes: number, isPartial: boolean }
