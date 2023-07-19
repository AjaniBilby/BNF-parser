import type _Shared from './shared.js';
export type _Literal = { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange };
export type Term_Program = {
	type: 'program',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		{ type: '(...)+', value: [Term_Def] & Array<Term_Def>, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_Program (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Program,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_W = {
	type: 'w',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(Term_Comment | _Literal & {value: "\x20"} | _Literal & {value: "\x09"} | _Literal & {value: "\x0a"} | _Literal & {value: "\x0d\x0a"})
	]
}
export declare function Parse_W (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_W,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Comment = {
	type: 'comment',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal & {value: "\x23"},
		_Literal,
		_Literal & {value: "\x0a"}
	]
}
export declare function Parse_Comment (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Comment,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Name = {
	type: 'name',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Letter,
		{ type: '(...)*', value: Array<(Term_Letter | Term_Digit | _Literal & {value: "\x5f"})>, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_Name (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Name,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Letter = {
	type: 'letter',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(_Literal | _Literal)
	]
}
export declare function Parse_Letter (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Letter,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Digit = {
	type: 'digit',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal
	]
}
export declare function Parse_Digit (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Digit,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Hex = {
	type: 'hex',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(_Literal | _Literal | _Literal)
	]
}
export declare function Parse_Hex (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Hex,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Constant = {
	type: 'constant',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		{ type: '(...)*', value: Array<Term_Frag>, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_Constant (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Constant,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Frag = {
	type: 'frag',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(Term_Byte | Term_Escape | _Literal)
	]
}
export declare function Parse_Frag (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Frag,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Escape = {
	type: 'escape',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal
	]
}
export declare function Parse_Escape (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Escape,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Byte = {
	type: 'byte',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal
	]
}
export declare function Parse_Byte (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Byte,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Def = {
	type: 'def',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal,
		Term_Expr
	]
}
export declare function Parse_Def (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Def,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Expr = {
	type: 'expr',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Expr_arg,
		{ type: '(...)*', value: Array<{
	type: '(...)',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal,
		Term_Expr_arg
	]
}>, start: number, end: number, count: number, ref: _Shared.ReferenceRange }
	]
}
export declare function Parse_Expr (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Expr,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Expr_arg = {
	type: 'expr_arg',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Expr_prefix,
		(Term_Constant | Term_Expr_brackets | _Literal),
		_Literal
	]
}
export declare function Parse_Expr_arg (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Expr_arg,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Expr_prefix = {
	type: 'expr_prefix',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		_Literal,
		_Literal,
		_Literal
	]
}
export declare function Parse_Expr_prefix (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Expr_prefix,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Expr_infix = {
	type: 'expr_infix',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(_Literal & {value: "\x2d\x3e"} | _Literal & {value: "\x7c"})
	]
}
export declare function Parse_Expr_infix (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Expr_infix,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Expr_suffix = {
	type: 'expr_suffix',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		(_Literal & {value: "\x2a"} | _Literal & {value: "\x3f"} | _Literal & {value: "\x2b"})
	]
}
export declare function Parse_Expr_suffix (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Expr_suffix,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}

export type Term_Expr_brackets = {
	type: 'expr_brackets',
	start: number,
	end: number,
	count: number,
	ref: _Shared.ReferenceRange,
	value: [
		Term_Expr
	]
}
export declare function Parse_Expr_brackets (i: string, refMapping?: boolean): _Shared.ParseError | {
	root: _Shared.SyntaxNode & Term_Expr_brackets,
	reachBytes: number,
	reach: null | _Shared.Reference,
	isPartial: boolean
}
