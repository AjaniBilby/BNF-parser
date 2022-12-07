# BNF-Parser <!-- no toc -->

[![Test](https://github.com/AjaniBilby/BNF-parser/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/AjaniBilby/BNF-parser/actions/workflows/test.yml)

- [BNF-Parser ](#bnf-parser-)
- [Example](#example)
- [API](#api)
  - [BNF Syntax](#bnf-syntax)
    - [Escape Codes](#escape-codes)
    - [Repetition `?`, `+`, `*`](#repetition---)
    - [Omit `%`](#omit-)
    - [Not `!`](#not-)
    - [Range `->`](#range--)
  - [Imports](#imports)
    - [BNF](#bnf)
    - [Parser](#parser)
    - [Compile](#compile)
    - [SyntaxNode](#syntaxnode)
    - [ParseError](#parseerror)
    - [Reference](#reference)
    - [Reference Range](#reference-range)
- [Syntax Tree](#syntax-tree)
  - [Sequences](#sequences)
  - [Select](#select)
  - [Omit](#omit)
  - [Gather](#gather)
  - [Not](#not)
  - [Range](#range)
  - [Literal](#literal)

A simple library for generate syntax pasers based BNF syntax descriptions.  
There are a few changes from standard BNF forms to help produce cleaner syntax tree outputs that BNFs normally provide.

# Example

First of all provide the BNF representation of you language, and parse that into a syntax tree. This tree can then be compiled down into a representation ready to parse syntax trees for the compiled language.

```ts
import { BNF, Parse, Compile } from "bnf-parser";

let result = BNF.parse(LANGUAGE_BNF);
let tree = Compile(result);

let syntax = tree.parse(FILE);
```

A compiled BNF can be saved as a JSON file and reloaded later

```ts
// Save the syntax tree
fs.writeFileSync(path, JSON.stringify(tree.serialize()));

// Load the compiled syntax tree
let tree = new Parser(
  JSON.parse( fs.readFileSync(path, 'utf8') )
);
```

# API

## BNF Syntax

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
	double ::= %"\"" ( ( "\\" ...any  ) | !"\""+ )* %"\"" ;
	single ::= %"\'" ( ( "\\" ...any  ) | !"\'"+ )* %"\'" ;

def ::= ...name %w+ %"::=" %w* expr %w* %";" ;

expr ::= expr_arg %w* ( ...expr_infix? %w* expr_arg %w* )* ;
	expr_arg ::= expr_prefix ( constant | expr_brackets | ...name ) ...expr_suffix? ;
	expr_prefix ::= "%"? "..."? "!"? ;
	expr_infix  ::= "->" | "|" ;
	expr_suffix ::= "*" | "?" | "+" ;
	expr_brackets ::= %"(" %w* expr %w* %")" ;
```

### Escape Codes

| Code | Result |
| :-: | :- |
| `\b` | Backspace |
| `\f` | Form Feed |
| `\n` | New Line |
| `\r` | Carriage Return |
| `\t` | Horizontal Tab |
| `\v` | Vertical Tab |
| - | Unrecognised escapes will result in just the character after the slash |

### Repetition `?`, `+`, `*`

Only one repetition mark should exist per argument.
```bnf
term # once
term? # one or zero
term+ # at least once
term* # zero or more
```

### Omit `%`

```bnf
%term
```

This operator will lead to the syntax under this operator being removed from the final syntax tree, however still remain as part of syntax validation. For instance in the BNF syntax above...

The omit character goes in front af a single term, and must be the front most operator placing it in from of any `not` or `gather` operators.

### Not `!`

```bnf
!term
```

This operator must be between two single length constants, this will accept all characters within the range of the two bounds (inclusive).  

### Range `->`

```bnf
"a"->"z" # will consume a single character
"a"->"z"* # will consume as many characters as are in the range
```

This operator must be between two single length constants, this will accept all characters within the range of the two bounds (inclusive). Until the repetition count is reached.  
The first operand must have no repetitions, however the repetition markers on the last operand will apply to the whole group.

## Imports

### BNF

This is a pre-initialised BNF parser, which can be given a BNF string input.

```ts
const BNF: Parser;
```

### Parser

Is initialised with a built syntax tree. Once initialized it can be given input strings to generate output syntax trees for a given language.

```ts
class Parser {
  constructor(blob: any) 

  // Attempts to parse a language into a syntax tree
  parse(
    input: string,    // The text to be parsed
    partial = false,  // Whether the entire string needs to be consucanmed
    entry = "program" // Where parsing should start from in the BNF definition
  ): SyntaxNode | ParseError
  setVerbose(mode: boolean) { }
}
```

### Compile

Given a `SyntaxNode` tree generated from the BNF pre-initialized parser it can generate a new parser.

```ts
function Compile(tree: SyntaxNode): Parser
```

```ts
class Reference {

  // Returns a deep copy of itself
  clone(): Reference

  // Stringifies itself for printing/debug
  toString(): string
}
```

```ts
class ReferenceRange {
  constructor(from: Reference, to: Reference)

  // Returns a deep copy of itself
  clone(): ReferenceRange

  // Stringifies itself for printing/debug
  toString(): string
}
```

```ts
class ParseError {
  constructor(msg: string, ref: ReferenceRange)

  // Stringifies itself for printing/debug
  toString(): string
}
```

### SyntaxNode

```ts
class SyntaxNode {
  type: string;
  value: SyntaxValue;
  ref: ReferenceRange;

  constructor(type: string, value: SyntaxValue, ref: ReferenceRange) {};

  // Merges all of it's child syntax node values into a single string
  flat(): string {};
}
```

### ParseError

```ts
class ParseError {
  stack: string[]
  msg: string
  ref: ReferenceRange

  constructor(msg: string, ref: ReferenceRange) { }

  // Adds a string to the top of the call stack
  //   (for internal use)
  add_stack(elm: string) { }

  // If this error contains a pass stack
  //   (for internal use)
  hasStack(): boolean { }

  // Stringifies itself for printing/debug
  toString() { }
}
```

### Reference

```ts
class Reference {
  line: number;
  col: number;
  index: number;

  constructor(line: number, col: number, index: number) { }

  // Will shift the reference one position forwards
  advance(newline: boolean = false) { }

  // Returns a deep copy of itself
  clone(): Reference { }

  // Stringifies itself for printing/debug
  toString(): string { }
}
```

### Reference Range

```ts
class ReferenceRange {
  start: Reference;
  end: Reference;

  constructor(from: Reference, to: Reference) { }

  // Alters itself so the rang supplied now fits within the range of itself
  //  Basically takes the min from, and the max to references and applies them to itself
  span(other: ReferenceRange) { }

  // Returns a deep copy of itself
  clone(): ReferenceRange { }

  // Stringifies itself for printing/debug
  toString(): string { }
}
```

# Syntax Tree

There are two main core abstractions for how the syntax trees are generated from a BNF, sequences and selects.

## Sequences

A sequence is a linear list of elements that make up a match. A top level sequence (right side of the `::=`) will resolve with the `.type` of the matching name (the name on the left of the `::=`), any sub-sequences `()` will appear as a syntax node with the name `(...)` with subsequent values being evaluated the same as the top level.

If there is a repetition marker such as `name+` there will be an extra noded added with the type `(...)+` of whom's children will be the number of times the pattern was matched.

## Select

Will resolve as the syntax tree of the first matching option. For instance if you have the select statement `variable | number`, if the parser matches a variable it would be the same as having a `variable` at that point in the sequence.

## Omit

Any omit statement within a sequence will be removed, and then looking at the outputted syntax tree it is like they never existed, however they are still critical to a successful match. In the case that they are within a select, they will still be visible with `.type` of `omit`, with no child nodes.
## Gather

This does not alter the outputted syntax tree form in relation to the sequence or select it is within, however it will squash all of it's child nodes back down into a single string. Node that this will reflect the affects of any omit operations which occurred within the child nodes.

## Not

It's `.values` will be a single string of all characters it could consume until it matched with the target expression.

## Range

Ranges will appear with the `.type` of `range` with `.value` being a single string with the characters consumed by this expression, inclusing any repetition markers (so a range with `+` will be a string of length at least one).

## Literal

Ranges will appear with the `.type` of `literal` with `.value` being a copy of the exact literal as a string.