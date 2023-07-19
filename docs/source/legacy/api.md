---
title: Legacy API
search:
  exclude: true
---

# Legacy API

!!! warning "Deprecated"

    These features are all deprecated and will not be updated  
    While they are still available within `v4.0` under the `legacy` namespace  
    However they will be phased out by the next major release

## BNF

This is a pre-initialised BNF parser, which can be given a BNF string input.

```ts
const BNF: Parser;
```

## Parser

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

## Compile

The `Compile` function is given a `SyntaxNode` tree generated from the pre-initialized `BNF` parser - from which it can generate a new parser.

```ts
function Compile(tree: SyntaxNode): Parser
```

## SyntaxNode

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

## ParseError

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

## Reference

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

## Reference Range

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