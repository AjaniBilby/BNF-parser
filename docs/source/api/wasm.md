# `wasm` Namespace

## Compile2Wasm

This is a wrapper around [`GenerateWasm`](#generatewasm) which allows you to go straight from a string representation of a bnf,
down to the [binaryen.Module](https://www.npmjs.com/package/binaryen#module-construction) without needing to generate a [`legacy.Parser`](/legacy/api/#parser) first.

```ts
function Compile2Wasm(inputBnf: string): Shared.ParseError | binaryen.Module
```

## CompileTypes

Takes in a [`legacy.Parser`](/legacy/api/#parser) as input for a bnf syntax,
and outputs the corresponding typescript definitions as a string for a compiled artifact which would be generated from the same input

```ts
function CompileTypes(lang: legacy.Parser): string
```

## GenerateWasm

Takes in a [`legacy.Parser`](/legacy/api/#parser) as input for a bnf syntax, and compiles it down to a [binaryen.Module](https://www.npmjs.com/package/binaryen#module-construction) which can then be used to generate `.wat` and `.wasm` outputs.

```ts
function GenerateWasm(lang: legacy.Parser): binaryen.Module
```

## Runner

### Runner.WasmParser

This is just a type interface used by all runners, including ones encoded in an artifact.
It is simply used to differentiate a wasm instance generated for BNF parsing, from a generic wasm instance.

```ts
type WasmParser = WebAssembly.Instance & {
	exports: {
		memory      : WebAssembly.Memory;
		input       : WebAssembly.Global;
		inputLength : WebAssembly.Global;
		heap        : WebAssembly.Global;

		_init:   () => number;
		program: () => number;
    // generated artifacts will have extra functions
    //   bound based on the BNF they are generated from
	}
}
```

### Runner.Create

This takes any `BufferSource` as input (i.e. `Uint8Array`), and synchronously generates a wasm instance from it.
This function will error in most browsers, as instantiating any WebAssembly module over `4KB` in size must be non-blocking.

```ts
function Create(wasm: BufferSource): WasmParser;
```

### Runner.Parse

Supply an already created [`WasmParser`](#runnerwasmparser) from [`Runner.Create`](#runnercreate),
a string input for the data to be parsed, as well as two optional modifiers to attempt to generate a syntax tree
using the given wasm instance.

```ts
function Parse(ctx: WasmParser, data: string, refMapping = true, entry = "program"): {
  reachBytes: number,
  isPartial: boolean,
  reach: Shared.Reference,
  root:  SyntaxNode,
}
```

#### Argument `refMapping`
If this is disabled, all SyntaxNodes will share a single [`ReferenceRange`](/api/shared/#referencerange) which reduces decode time as the proper references don't need to be calculated during decoding, and nor do new object instances need to be generated reducing allocations.

If this is enabled a proper reference range will be generated for every [`SyntaxNode`](/api/shared/#syntaxnode).

You can detect if a [`SyntaxNode`](/api/shared/#reference) has been source mapped or not, because a non-source mapped node's `.ref` will have the start and end points being the exact same object (i.e. `start === end`), but also all values in the `Reference` will be zero, which is invalid as col and line numbers both start counting from `1`.

#### Argument `entry`
This tells the parser which term in the bnf to start parsing from.

### Runner.toString

This function is intended for internal use only.
It's used to generate the [shared artifact](/artifact/shared)

```ts
function toString(): string;
```