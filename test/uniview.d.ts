import * as _Shared from "./shared.js";
export type Term_Program = {
  type: "program", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Stmt_top
  ]
}[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function program (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Program, reachBytes: number, isPartial: boolean }

export type Term_Stmt_top = {
  type: "stmt_top", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    (Term_Function | Term_Impl | Term_Struct | Term_Trait | Term_Library | Term_External | Term_Include)
  ]
}
export declare function stmt_top (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Stmt_top, reachBytes: number, isPartial: boolean }

export type Term_W = {
  type: "w", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: "\x20", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x09", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | Term_Nl | Term_Comment)
  ]
}
export declare function w (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_W, reachBytes: number, isPartial: boolean }

export type Term_Nl = {
  type: "nl", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: "\x0d\x0a", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x0a", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })
  ]
}
export declare function nl (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Nl, reachBytes: number, isPartial: boolean }

export type Term_Digit = {
  type: "digit", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function digit (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Digit, reachBytes: number, isPartial: boolean }

export type Term_Digit_nz = {
  type: "digit_nz", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function digit_nz (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Digit_nz, reachBytes: number, isPartial: boolean }

export type Term_Letter = {
  type: "letter", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })
  ]
}
export declare function letter (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Letter, reachBytes: number, isPartial: boolean }

export type Term_Comment = {
  type: "comment", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    (Term_Comment_single | Term_Comment_multi)
  ]
}
export declare function comment (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Comment, reachBytes: number, isPartial: boolean }

export type Term_Comment_single = {
  type: "comment_single", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: "\x2f\x2f", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    Term_Nl
  ]
}
export declare function comment_single (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Comment_single, reachBytes: number, isPartial: boolean }

export type Term_Comment_multi = {
  type: "comment_multi", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: "\x2f\x2a", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "(...)", value: ({ type: "literal", value: "\x5c\x2a", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "literal", value: "\x2a\x2f", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function comment_multi (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Comment_multi, reachBytes: number, isPartial: boolean }

export type Term_Constant = {
  type: "constant", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    (Term_Boolean | Term_Void | Term_String | Term_Hexadecimal | Term_Octal | Term_Binary | Term_Float | Term_Integer)
  ]
}
export declare function constant (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Constant, reachBytes: number, isPartial: boolean }

export type Term_String = {
  type: "string", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    (Term_String_unicode | Term_String_text)
  ]
}
export declare function string (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_String, reachBytes: number, isPartial: boolean }

export type Term_String_unicode = {
  type: "string_unicode", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: ({
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: "\x5c", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
} | { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function string_unicode (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_String_unicode, reachBytes: number, isPartial: boolean }

export type Term_String_text = {
  type: "string_text", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: ({
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: "\x5c", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
} | { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function string_text (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_String_text, reachBytes: number, isPartial: boolean }

export type Term_Hexadecimal = {
  type: "hexadecimal", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: "0x", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function hexadecimal (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Hexadecimal, reachBytes: number, isPartial: boolean }

export type Term_Hex_char = {
  type: "hex_char", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    (Term_Digit | { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })
  ]
}
export declare function hex_char (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Hex_char, reachBytes: number, isPartial: boolean }

export type Term_Octal = {
  type: "octal", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: "0o", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function octal (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Octal, reachBytes: number, isPartial: boolean }

export type Term_Octal_char = {
  type: "octal_char", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function octal_char (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Octal_char, reachBytes: number, isPartial: boolean }

export type Term_Binary = {
  type: "binary", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: "0b", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "(...)", value: ({ type: "literal", value: "0", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "1", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function binary (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Binary, reachBytes: number, isPartial: boolean }

export type Term_Boolean = {
  type: "boolean", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: "true", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "false", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })
  ]
}
export declare function boolean (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Boolean, reachBytes: number, isPartial: boolean }

export type Term_Void = {
  type: "void", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: "void", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function void (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Void, reachBytes: number, isPartial: boolean }

export type Term_Integer = {
  type: "integer", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: [] | [{ type: "literal", value: "\x2d", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function integer (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Integer, reachBytes: number, isPartial: boolean }

export type Term_Integer_u = {
  type: "integer_u", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    ({
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Digit_nz,
    { type: "(...)", value: Term_Digit[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
} | Term_Zero)
  ]
}
export declare function integer_u (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Integer_u, reachBytes: number, isPartial: boolean }

export type Term_Zero = {
  type: "zero", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: "0", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function zero (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Zero, reachBytes: number, isPartial: boolean }

export type Term_Float = {
  type: "float", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "literal", value: "\x2e", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "(...)", value: [] | [{
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: "e", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function float (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Float, reachBytes: number, isPartial: boolean }

export type Term_Access = {
  type: "access", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "(...)", value: (Term_Access_static | Term_Access_dynamic | Term_Access_template)[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function access (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Access, reachBytes: number, isPartial: boolean }

export type Term_Access_static = {
  type: "access_static", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function access_static (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Access_static, reachBytes: number, isPartial: boolean }

export type Term_Access_dynamic = {
  type: "access_dynamic", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Call_args
  ]
}
export declare function access_dynamic (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Access_dynamic, reachBytes: number, isPartial: boolean }

export type Term_Access_template = {
  type: "access_template", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Template_args
  ]
}
export declare function access_template (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Access_template, reachBytes: number, isPartial: boolean }

export type Term_Access_template_args = {
  type: "access_template_args", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Access_template_arg,
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Access_template_arg
  ]
}[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function access_template_args (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Access_template_args, reachBytes: number, isPartial: boolean }

export type Term_Access_template_arg = {
  type: "access_template_arg", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    (Term_Constant | Term_Data_type)
  ]
}
export declare function access_template_arg (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Access_template_arg, reachBytes: number, isPartial: boolean }

export type Term_Name = {
  type: "name", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: (Term_Letter | { type: "literal", value: "\x5f", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "(...)", value: (Term_Letter | Term_Digit | { type: "literal", value: "\x5f", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function name (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Name, reachBytes: number, isPartial: boolean }

export type Term_Variable = {
  type: "variable", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "(...)", value: (Term_Access_static | Term_Access_dynamic)[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function variable (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Variable, reachBytes: number, isPartial: boolean }

export type Term_Data_type = {
  type: "data_type", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "(...)", value: (Term_Access_static | Term_Access_template)[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function data_type (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Data_type, reachBytes: number, isPartial: boolean }

export type Term_Data_type_access = {
  type: "data_type_access", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function data_type_access (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Data_type_access, reachBytes: number, isPartial: boolean }

export type Term_Declare = {
  type: "declare", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "(...)", value: [] | [{
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Data_type
  ]
}], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "(...)", value: [] | [{
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Expr
  ]
}], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function declare (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Declare, reachBytes: number, isPartial: boolean }

export type Term_Assign = {
  type: "assign", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Variable,
    Term_Expr
  ]
}
export declare function assign (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Assign, reachBytes: number, isPartial: boolean }

export type Term_Function = {
  type: "function", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Func_head,
    (Term_Function_body | { type: "literal", value: "\x3b", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })
  ]
}
export declare function function (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Function, reachBytes: number, isPartial: boolean }

export type Term_Func_head = {
  type: "func_head", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    Term_Func_arguments,
    { type: "(...)", value: [] | [{
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Data_type
  ]
}], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function func_head (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Func_head, reachBytes: number, isPartial: boolean }

export type Term_Func_arguments = {
  type: "func_arguments", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: [] | [{
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Func_arg,
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Func_arg
  ]
}[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function func_arguments (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Func_arguments, reachBytes: number, isPartial: boolean }

export type Term_Func_arg = {
  type: "func_arg", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    Term_Data_type
  ]
}
export declare function func_arg (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Func_arg, reachBytes: number, isPartial: boolean }

export type Term_Function_body = {
  type: "function_body", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Func_stmt
  ]
}[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function function_body (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Function_body, reachBytes: number, isPartial: boolean }

export type Term_Func_stmt = {
  type: "func_stmt", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    (Term_If | Term_When | Term_Return | Term_Declare | Term_Assign | Term_Call_procedure)
  ]
}
export declare function func_stmt (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Func_stmt, reachBytes: number, isPartial: boolean }

export type Term_Function_outline = {
  type: "function_outline", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Func_head
  ]
}
export declare function function_outline (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Function_outline, reachBytes: number, isPartial: boolean }

export type Term_Function_redirect = {
  type: "function_redirect", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_String,
    Term_Func_arguments,
    { type: "(...)", value: [] | [{
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Data_type
  ]
}], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function function_redirect (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Function_redirect, reachBytes: number, isPartial: boolean }

export type Term_Call = {
  type: "call", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Access,
    Term_Call_body
  ]
}
export declare function call (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Call, reachBytes: number, isPartial: boolean }

export type Term_Call_body = {
  type: "call_body", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: [] | [Term_Call_args], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function call_body (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Call_body, reachBytes: number, isPartial: boolean }

export type Term_Call_args = {
  type: "call_args", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Expr,
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Expr
  ]
}[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function call_args (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Call_args, reachBytes: number, isPartial: boolean }

export type Term_Call_procedure = {
  type: "call_procedure", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Call
  ]
}
export declare function call_procedure (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Call_procedure, reachBytes: number, isPartial: boolean }

export type Term_Return = {
  type: "return", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: [] | [{
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Expr
  ]
}], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function return (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Return, reachBytes: number, isPartial: boolean }

export type Term_Struct = {
  type: "struct", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    Term_Struct_body
  ]
}
export declare function struct (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Struct, reachBytes: number, isPartial: boolean }

export type Term_Struct_body = {
  type: "struct_body", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Struct_stmt
  ]
}[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function struct_body (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Struct_body, reachBytes: number, isPartial: boolean }

export type Term_Struct_stmt = {
  type: "struct_stmt", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    (Term_Struct_attribute | Term_Struct_attribute)
  ]
}
export declare function struct_stmt (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Struct_stmt, reachBytes: number, isPartial: boolean }

export type Term_Struct_attribute = {
  type: "struct_attribute", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    Term_Data_type
  ]
}
export declare function struct_attribute (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Struct_attribute, reachBytes: number, isPartial: boolean }

export type Term_Impl = {
  type: "impl", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Data_type,
    { type: "(...)", value: [] | [Term_Impl_for], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    Term_Impl_body
  ]
}
export declare function impl (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Impl, reachBytes: number, isPartial: boolean }

export type Term_Impl_for = {
  type: "impl_for", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Data_type
  ]
}
export declare function impl_for (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Impl_for, reachBytes: number, isPartial: boolean }

export type Term_Impl_body = {
  type: "impl_body", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Impl_stmt
  ]
}[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function impl_body (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Impl_body, reachBytes: number, isPartial: boolean }

export type Term_Impl_stmt = {
  type: "impl_stmt", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    (Term_Function | Term_Function)
  ]
}
export declare function impl_stmt (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Impl_stmt, reachBytes: number, isPartial: boolean }

export type Term_Trait = {
  type: "trait", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "(...)", value: [] | [Term_Trait_reliance], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    Term_Trait_body
  ]
}
export declare function trait (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Trait, reachBytes: number, isPartial: boolean }

export type Term_Trait_reliance = {
  type: "trait_reliance", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Data_type,
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Data_type
  ]
}[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function trait_reliance (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Trait_reliance, reachBytes: number, isPartial: boolean }

export type Term_Trait_body = {
  type: "trait_body", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Trait_stmt
  ]
}[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function trait_body (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Trait_body, reachBytes: number, isPartial: boolean }

export type Term_Trait_stmt = {
  type: "trait_stmt", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    (Term_Function | Term_Function)
  ]
}
export declare function trait_stmt (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Trait_stmt, reachBytes: number, isPartial: boolean }

export type Term_Expr_struct = {
  type: "expr_struct", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Data_type,
    Term_Expr_struct_body
  ]
}
export declare function expr_struct (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_struct, reachBytes: number, isPartial: boolean }

export type Term_Expr_struct_body = {
  type: "expr_struct_body", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: [] | [Term_Expr_struct_args], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function expr_struct_body (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_struct_body, reachBytes: number, isPartial: boolean }

export type Term_Expr_struct_args = {
  type: "expr_struct_args", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Expr_struct_arg,
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Expr_struct_arg
  ]
}[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function expr_struct_args (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_struct_args, reachBytes: number, isPartial: boolean }

export type Term_Expr_struct_arg = {
  type: "expr_struct_arg", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    Term_Expr
  ]
}
export declare function expr_struct_arg (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_struct_arg, reachBytes: number, isPartial: boolean }

export type Term_Template = {
  type: "template", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Template_args
  ]
}
export declare function template (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Template, reachBytes: number, isPartial: boolean }

export type Term_Template_args = {
  type: "template_args", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Struct_attribute,
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Struct_attribute
  ]
}[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function template_args (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Template_args, reachBytes: number, isPartial: boolean }

export type Term_Expr = {
  type: "expr", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
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
export declare function expr (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr, reachBytes: number, isPartial: boolean }

export type Term_Expr_left_oper = {
  type: "expr_left_oper", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: "\x21", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x24", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x40", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x2d", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })
  ]
}
export declare function expr_left_oper (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_left_oper, reachBytes: number, isPartial: boolean }

export type Term_Expr_middle_oper = {
  type: "expr_middle_oper", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: "\x2c", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x3f", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x3a", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x26\x26", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x7c\x7c", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x3d\x3d", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x21\x3d", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x3c\x3d", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x3e\x3d", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x3c", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x3e", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x25", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x2a", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x2f", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x2b", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x2d", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "\x2d\x3e", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })
  ]
}
export declare function expr_middle_oper (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_middle_oper, reachBytes: number, isPartial: boolean }

export type Term_Expr_arg = {
  type: "expr_arg", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: [] | [Term_Expr_left_oper], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    (Term_Constant | Term_Expr_brackets | Term_Expr_val)
  ]
}
export declare function expr_arg (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_arg, reachBytes: number, isPartial: boolean }

export type Term_Expr_val = {
  type: "expr_val", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Access,
    { type: "(...)", value: [] | [(Term_Expr_struct_body | Term_Call_body)], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function expr_val (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_val, reachBytes: number, isPartial: boolean }

export type Term_Expr_brackets = {
  type: "expr_brackets", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Expr
  ]
}
export declare function expr_brackets (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Expr_brackets, reachBytes: number, isPartial: boolean }

export type Term_Library = {
  type: "library", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    (Term_Import | Term_Import)
  ]
}
export declare function library (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Library, reachBytes: number, isPartial: boolean }

export type Term_Import = {
  type: "import", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_String,
    { type: "(...)", value: [] | [{
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function import (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Import, reachBytes: number, isPartial: boolean }

export type Term_Include = {
  type: "include", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    Term_String
  ]
}
export declare function include (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Include, reachBytes: number, isPartial: boolean }

export type Term_Include_type = {
  type: "include_type", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: "llvm", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "cpp", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "c", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })
  ]
}
export declare function include_type (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Include_type, reachBytes: number, isPartial: boolean }

export type Term_External = {
  type: "external", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    Term_External_body
  ]
}
export declare function external (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_External, reachBytes: number, isPartial: boolean }

export type Term_External_mode = {
  type: "external_mode", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: "assume", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | { type: "literal", value: "export", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange })
  ]
}
export declare function external_mode (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_External_mode, reachBytes: number, isPartial: boolean }

export type Term_External_body = {
  type: "external_body", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_External_term,
    { type: "(...)", value: Term_W[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function external_body (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_External_body, reachBytes: number, isPartial: boolean }

export type Term_External_term = {
  type: "external_term", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    (Term_Function_redirect | Term_Function_outline | Term_Type_def | Term_Struct)
  ]
}
export declare function external_term (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_External_term, reachBytes: number, isPartial: boolean }

export type Term_Type_def = {
  type: "type_def", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    { type: "literal", value: string, start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    Term_Integer
  ]
}
export declare function type_def (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Type_def, reachBytes: number, isPartial: boolean }

export type Term_If = {
  type: "if", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_If_stmt,
    { type: "(...)", value: {
  type: "(...)", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Elif_stmt
  ]
}[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange },
    { type: "(...)", value: [] | [Term_Else_stmt], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function if (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_If, reachBytes: number, isPartial: boolean }

export type Term_If_stmt = {
  type: "if_stmt", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Expr,
    Term_Function_body
  ]
}
export declare function if_stmt (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_If_stmt, reachBytes: number, isPartial: boolean }

export type Term_Elif_stmt = {
  type: "elif_stmt", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Expr,
    Term_Function_body
  ]
}
export declare function elif_stmt (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Elif_stmt, reachBytes: number, isPartial: boolean }

export type Term_Else_stmt = {
  type: "else_stmt", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Function_body
  ]
}
export declare function else_stmt (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_Else_stmt, reachBytes: number, isPartial: boolean }

export type Term_When = {
  type: "when", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    Term_Variable,
    { type: "(...)", value: Term_When_opt[], start: number, end: number, count: number, ref: null | _Shared.ReferenceRange }
  ]
}
export declare function when (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_When, reachBytes: number, isPartial: boolean }

export type Term_When_opt = {
  type: "when_opt", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange,
  value: [
    ({ type: "literal", value: "default", start: number, end: number, count: number, ref: null | _Shared.ReferenceRange } | Term_Data_type),
    Term_Function_body
  ]
}
export declare function when_opt (i: string): _Shared.ParseError | { root: _Shared.SyntaxNode & Term_When_opt, reachBytes: number, isPartial: boolean }
