# BNF-Parser <!-- no toc -->

[![Test via NPM](https://github.com/AjaniBilby/BNF-parser/actions/workflows/npm-load-check.yml/badge.svg?branch=master)](https://github.com/AjaniBilby/BNF-parser/actions/workflows/npm-load-check.yml)
[![Test](https://github.com/AjaniBilby/BNF-parser/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/AjaniBilby/BNF-parser/actions/workflows/test.yml)

BNF-Parser is a simple library for generating syntax parsers based on deterministic BNF syntax descriptions. It includes a few changes from standard BNF forms to help produce cleaner syntax tree outputs.

- [BNF-Parser ](#bnf-parser-)
- [Example](#example)
- [API](#api)
  - [BNF Syntax](#bnf-syntax)
    - [Escape Codes](#escape-codes)
    - [Repetition Operator `?`, `+`, `*`](#repetition-operator---)
    - [Omit Operator `%`](#omit-operator-)
    - [Not Operator `!`](#not-operator-)
    - [Range Operator `->`](#range-operator--)
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
  - [Repetition](#repetition)
  - [Literal](#literal)

# Example

First, provide the BNF representation of your language and parse it into a syntax tree. Then, compile the tree into a representation that is ready to parse syntax trees for the compiled language.

```ts
import { BNF, Compile } from "bnf-parser";

let result = BNF.parse(LANGUAGE_BNF);
let tree = Compile(result);

let syntax = tree.parse(FILE);
```

You can save a compiled BNF as a JSON file and reload it later:
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

### Repetition Operator `?`, `+`, `*`

Only one repetition mark should exist per argument.
```bnf
term # once
term? # one or zero
term+ # at least once
term* # zero or more
```

[Resulting syntax layout](#repetition)

### Omit Operator `%`

```bnf
%term
```

The omit operator is placed in front of a single term and must be the front-most operator, preceding any `not` or `gather` operators. It causes the syntax under this operator to be removed from the final syntax tree but still remain part of syntax validation.

[Resulting syntax layout](#omit)

### Not Operator `!`

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

[Resulting syntax layout](#not)

### Range Operator `->`

```bnf
term -> term
```

The range operator is used to define a range between two single-length constants, allowing the parser to match any character within the specified range. This is useful for simplifying character ranges in BNF descriptions.

```bnf
"a"->"z"  # Matches a single character within the range "a" to "z"
"a"->"z"* # Matches a sequence of characters within the range "a" to "z"
```

The range operator can be combined with repetition markers to control the number of characters consumed within the specified range.

[Resulting syntax layout](#range)

## Imports

### BNF

This is a pre-initialised BNF parser, which can be given a BNF string input.

```ts
const BNF: Parser;
```

### Parser

The `Parser` class is used to parse input based on the syntax tree generated by the `BNF` class.

```ts
class Parser {
  constructor(blob: any)

  // Attempts to parse a language into a syntax tree
  parse(
    input   : string,             // The text to be parsed
    partial : boolean = false,    // Whether the entire string needs to be consucanmed
    entry   : string  = "program" // Where parsing should start from in the BNF definition
  ): SyntaxNode | ParseError
  setVerbose(mode: boolean) { }
}
```

### Compile

The `Compile` function is given a `SyntaxNode` tree generated from the pre-initialized `BNF` parser - from which it can generate a new parser.

```ts
function Compile(tree: SyntaxNode): Parser
```

### SyntaxNode

The `SyntaxNode` class represents a node in the generated syntax tree.

The type value of a `SyntaxNode` is typically the name of the term being matched - i.e. the root node will be `program` by default.
However it can be a generated name in the case of brackets `(...)` and repetition markers such as `+` `(...)+`.

```ts
class SyntaxNode {
  type  : string;
  value : SyntaxValue;
  ref   : ReferenceRange;

  constructor(type: string, value: SyntaxValue, ref: ReferenceRange) {};

  // Merges all of it's child syntax node values into a single string
  flat(): string {};
}

type SyntaxValue = SyntaxNode[] | string;
```

### ParseError

The `ParseError` class represents an error that occurred during parsing of the input.

```ts
class ParseError {
  stack : string[]
  msg   : string
  ref   : ReferenceRange

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

The `Reference` class is a cursor to describe a certain point in a string input.

```ts
class Reference {
  index : number;
  line  : number;
  col   : number;

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

The `ReferenceRange` class uses two `Reference`s to describe a range within the text input.

```ts
class ReferenceRange {
  start : Reference;
  end   : Reference;

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

There are two primary abstractions in generating syntax trees from BNF: sequences and selections.

## Sequences

A sequence is an ordered list of elements that form a match. A top-level sequence (right side of the `::=`) will resolve with the `SyntaxNode.type` of the matching name (the name on the left of the `::=`). Sub-sequences within parentheses `()` will appear as a syntax node with the name `(...)` and will be evaluated similarly to the top level.

If a repetition marker like name+ is used, additional nodes with the type `(...)+` will be added, and their children will represent the number of times the pattern matched.

## Select

A selection will resolve as the syntax tree of the first matching option. For example, if you have the selection statement `variable | number`, and the parser matches a `variable`, it would be the same as having a `variable` in that position in the sequence.

> The selection statement will always consume the first valid option, so you should order your selection statements accordingly. For example:
> i.e.
> ```bnf
> program ::= "a" | "aa" ;
> ```
> In this case, providing the input "aa" will fail, as it will consume the single "a", and since there is no repetition, the program will end, leaving the second "a" unconsumed. As the syntax did not parse the whole string, this is considered an error. 
> See [Parser](#parser) for information on allowing partial matches.

## Omit

Omit statements within a sequence will be removed, and they will not be present in the output syntax tree. However, they are still crucial for a successful match. If they are within a selection, they will be visible with `SyntaxNode.type` of `omit` and no child nodes.

## Gather

Gather does not change the output syntax tree structure relative to the sequence or selection it is within. However, it combines all of its child nodes into a single string. Note that this reflects the effects of any omit operations within the child nodes.

## Not

The `SyntaxNode.values` will be a single string containing all characters consumed until it matched the target expression of the repetition limit is reached.

## Range

Ranges will appear with the `SyntaxNode.type` of `range` with `SyntaxNode.value` being a single string with the characters consumed by this expression, accounting for any repetition markers (so a range with `+` will be a string of length at least one).

## Repetition

A repetition marker creates its own node in the syntax tree, with its children representing the value of each repetition. The `SyntaxNode.type` value of this node will be the `(...)` followed by the repetition marker used, such as: `(...)+`, `(...)*`, or `(...)?`.

## Literal

Literals will appear with the `SyntaxNode.type` of `literal` and `SyntaxNode.value` as an exact copy of the literal as a string.