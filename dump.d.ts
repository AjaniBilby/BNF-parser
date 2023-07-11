declare type Reference = {
	start: number;
	end  : number;
}
declare type ReferenceRange = {
	start: Reference;
	end  : Reference;
}
declare type SyntaxNode = {
	type : string;
	start: number;
	end  : number;
	count: number;
	value: SyntaxNode[] | string;
	ref: ReferenceRange | null;
}
export type Term_Program = SyntaxNode & {
  type: "(...)", value: [
    SyntaxNode & { type: "(...)+", value: Term_Def[] }
  ]
}
export type Term_W = SyntaxNode & {
  type: "(...)", value: [
    (Term_Comment | (SyntaxNode & { type: "literal", value: "\x20" }) | (SyntaxNode & { type: "literal", value: "\x09" }) | (SyntaxNode & { type: "literal", value: "\x0a" }) | (SyntaxNode & { type: "literal", value: "\x0d" }))
  ]
}
export type Term_Comment = SyntaxNode & {
  type: "(...)", value: [
    (SyntaxNode & { type: "literal", value: "\x23" }),
    (SyntaxNode & { type: "literal", value: string }),
    (SyntaxNode & { type: "literal", value: "\x0a" })
  ]
}
export type Term_Name = SyntaxNode & {
  type: "(...)", value: [
    (SyntaxNode & { type: "literal", value: string })
  ]
}
export type Term_Letter = SyntaxNode & {
  type: "(...)", value: [
    ((SyntaxNode & { type: "literal", value: string }) | (SyntaxNode & { type: "literal", value: string }))
  ]
}
export type Term_Digit = SyntaxNode & {
  type: "(...)", value: [
    (SyntaxNode & { type: "literal", value: string })
  ]
}
export type Term_Hex = SyntaxNode & {
  type: "(...)", value: [
    ((SyntaxNode & { type: "literal", value: string }) | (SyntaxNode & { type: "literal", value: string }) | (SyntaxNode & { type: "literal", value: string }))
  ]
}
export type Term_Constant = SyntaxNode & {
  type: "(...)", value: [
    SyntaxNode & { type: "(...)*", value: Term_Frag[] }
  ]
}
export type Term_Frag = SyntaxNode & {
  type: "(...)", value: [
    (Term_Escape | (SyntaxNode & { type: "literal", value: string }))
  ]
}
export type Term_Escape = SyntaxNode & {
  type: "(...)", value: [
    (SyntaxNode & { type: "literal", value: string })
  ]
}
export type Term_Byte = SyntaxNode & {
  type: "(...)", value: [
    (SyntaxNode & { type: "literal", value: string })
  ]
}
export type Term_Def = SyntaxNode & {
  type: "(...)", value: [
    Term_Name,
    Term_Expr
  ]
}
export type Term_Expr = SyntaxNode & {
  type: "(...)", value: [
    Term_Expr_arg,
    SyntaxNode & { type: "(...)*", value: SyntaxNode & {
  type: "(...)", value: [
    (SyntaxNode & { type: "literal", value: string }),
    Term_Expr_arg
  ]
}[] }
  ]
}
export type Term_Expr_arg = SyntaxNode & {
  type: "(...)", value: [
    Term_Expr_prefix,
    ((SyntaxNode & { type: "literal", value: string }) | Term_Expr_brackets | Term_Name),
    (SyntaxNode & { type: "literal", value: string })
  ]
}
export type Term_Expr_prefix = SyntaxNode & {
  type: "(...)", value: [
    (SyntaxNode & { type: "literal", value: string }),
    (SyntaxNode & { type: "literal", value: string }),
    (SyntaxNode & { type: "literal", value: string })
  ]
}
export type Term_Expr_infix = SyntaxNode & {
  type: "(...)", value: [
    ((SyntaxNode & { type: "literal", value: "\x2d\x3e" }) | (SyntaxNode & { type: "literal", value: "\x7c" }))
  ]
}
export type Term_Expr_suffix = SyntaxNode & {
  type: "(...)", value: [
    ((SyntaxNode & { type: "literal", value: "\x2a" }) | (SyntaxNode & { type: "literal", value: "\x3f" }) | (SyntaxNode & { type: "literal", value: "\x2b" }))
  ]
}
export type Term_Expr_brackets = SyntaxNode & {
  type: "(...)", value: [
    Term_Expr
  ]
}