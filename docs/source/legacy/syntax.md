---
title: Legacy Syntax
search:
  exclude: true
---

# Legacy Syntax

!!! warning "Deprecated"

    These features are all deprecated and will not be updated  
    While they are still available within `v4.0` under the `legacy` namespace  
    However they will be phased out by the next major release

## Outline
```bnf
program ::= %w* ( def %w* )+ ;

# Consumes a single wild character
any ::= !"" ;

# Whitespace
w ::= comment | " " | "\t" | "\n" | "\r" ;
	comment ::= "#" !"\n"* "\n" ;

name ::= ...( letter | digit | "_" )+ ;
	letter ::= "a"->"z" | "A"->"Z" ;
	digit ::= "0"->"9" ;

constant ::= single | double ;
	double ::= %"\"" ( ( "\\" ...any ) | !"\""+ )* %"\"" ;
	single ::= %"\'" ( ( "\\" ...any ) | !"\'"+ )* %"\'" ;

def ::= ...name %w+ %"::=" %w* expr %w* %";" ;

expr ::= expr_arg %w* ( ...expr_infix? %w* expr_arg %w* )* ;
	expr_arg ::= expr_prefix ( constant | expr_brackets | ...name ) ...expr_suffix? ;
	expr_prefix ::= "%"? "..."? "!"? ;
	expr_infix  ::= "->" | "|" ;
	expr_suffix ::= "*" | "?" | "+" ;
	expr_brackets ::= %"(" %w* expr %w* %")" ;
```

## Escape Codes

| Code | Result |
| :-: | :- |
| `\b` | Backspace |
| `\f` | Form Feed |
| `\n` | New Line |
| `\r` | Carriage Return |
| `\t` | Horizontal Tab |
| `\v` | Vertical Tab |
| - | Unrecognised escapes will result in just the character after the slash |

## Repetition Operator `?`, `+`, `*`

Only one repetition mark should exist per argument.
```bnf
term # once
term? # one or zero
term+ # at least once
term* # zero or more
```

[Resulting syntax layout](/legacy/tree-structure/#repetition)

## Omit Operator `%`

```bnf
%term
```

The omit operator is placed in front of a single term and must be the front-most operator, preceding any `not` or `gather` operators. It causes the syntax under this operator to be removed from the final syntax tree but still remain part of syntax validation.

[Resulting syntax layout](/legacy/tree-structure/#omit)

## Not Operator `!`

```bnf
!term
```

The not operator is used to consume a single token as long as the term it precedes does not match. It can also be used with repetition markers to consume multiple tokens that do not match the specified term.

```bnf
!"a"   # Matches any single character except "a"
!"a"*  # Matches any sequence of characters excluding "a"
!"a"+  # Matches any sequence of characters with at least one character, excluding "a"
```

This can be very powerful when used in conjunction with other operations such as select
```bnf
non_vowel ::= !(
  "a" | "e" | "i" | "o" | "u" |
  "A" | "E" | "I" | "O" | "U"
) ; # this will match any non-vowel, which includes non-letter characters
```

[Resulting syntax layout](/legacy/tree-structure/#not)

## Range Operator `->`

```bnf
term -> term
```

The range operator is used to define a range between two single-length constants, allowing the parser to match any character within the specified range. This is useful for simplifying character ranges in BNF descriptions.

```bnf
"a"->"z"  # Matches a single character within the range "a" to "z"
"a"->"z"* # Matches a sequence of characters within the range "a" to "z"
```

The range operator can be combined with repetition markers to control the number of characters consumed within the specified range.

[Resulting syntax layout](/legacy/tree-structure/#range)