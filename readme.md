# BNF-Parser <!-- no toc -->

- [BNF-Parser ](#bnf-parser-)
- [Example](#example)
  - [API](#api)
    - [BNF](#bnf)
    - [Parser](#parser)
    - [Compile](#compile)
    - [SyntaxNode](#syntaxnode)
    - [ParseError](#parseerror)
    - [Reference](#reference)
    - [Reference Range](#reference-range)
  - [BNF Syntax](#bnf-syntax)
    - [Repetition `?`, `+`, `*`](#repetition---)
    - [Omit `%`](#omit-)
    - [Not `!`](#not-)
    - [Range `->`](#range--)

A simple library for generate syntax pasers based BNF syntax descriptions.  
There are a few changes from standard BNF forms to help produce cleaner syntax tree outputs that BNFs normally provide.

# Example

First of all provide the BNF representation of you language, and parse that into a syntax tree. This tree can then be compiled down into a representation ready to parse syntax trees for the compiled language.

```ts
import { BNF, Parse, Compile } from "bnf-parser";

let result: SyntaxNode = BNF.parse(language_syntax);
let tree = Compile(tree);

let syntax = tree.parse(file);
```

A compiled BNF can be saved as a JSON file and reloaded later

```ts
// Save the syntax tree
fs.writeFileSync(path, JSON.stringify(tree.serialize();));

// Load the compiled syntax tree
let tree = new Parser(
  JSON.parse( fs.readFileSync(path, 'utf8') )
);
```

## API

### BNF

This is a pre-initalised BNF parser, which can be given a BNF string input.

```ts
const BNF: Parser;
```

### Parser

Is initialised with a built syntax tree. Once initalized it can be given input strings to generate output syntax trees for a given language.

```ts
class Parser {
  constructor(blob: any) 
  parse(input: string, partial = false, entry = "program"): SyntaxNode | ParseError
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
  clone(): Reference
  toString(): string
}
```

```ts
class ReferenceRange {
  constructor(from: Reference, to: Reference)
  clone(): ReferenceRange
  toString(): string
}
```

```ts
class ParseError {
  constructor(msg: string, ref: ReferenceRange)
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

	add_stack(elm: string) { }
	hasStack(): boolean { }
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
	advance(newline: boolean = false) { }
	clone(): Reference { }
	toString(): string { }
}
```

### Reference Range

```ts
class ReferenceRange {
	start: Reference;
	end: Reference;

	constructor(from: Reference, to: Reference) { }
	span(other: ReferenceRange) { }
	clone(): ReferenceRange { }
	toString(): string { }
}
```


## BNF Syntax

```bnf
program ::= %w* ( def %w* )+ ;

# Consume a single wild character
any ::= !"" ;

# White space characters
w ::= " " | "\t" | %comment | "\n" | "\r" ;
  comment ::= "#" !"\n"* "\n" ;

name ::= ...( letter | digit | "_" )+ ;
  letter ::= "a"->"z" | "A"->"Z" ;
  digit ::= "0"->"9" ;

# String literals
constant ::= ...( single | double ) ;
  double ::= %"\"" ...( ( "\\" any  ) | !"\"" )* %"\"" ;
  single ::= %"\'" ...( ( "\\" any  ) | !"\'" )* %"\'" ;

def ::= ...name %w+ %"::=" %w* expr %w* %";" ;

expr ::= expr_arg %w* ( ...expr_infix? %w* expr_arg %w* )* ;
  expr_arg ::= expr_prefix ( ...constant | expr_brackets | ...name ) ...expr_suffix? ;
  expr_prefix ::= "%"? "..."? "!"? ;
  expr_infix  ::= "->" | "|" ;
  expr_suffix ::= "*" | "?" | "+" ;
  expr_brackets ::= %"(" %w* expr %w* %")" ;
```

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