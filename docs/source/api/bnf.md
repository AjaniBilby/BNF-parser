# `bnf` Namespace

This namespace is actually an already instantiated bnf parser compiled with the language itself.
It shares all similar properties as a regular [individual artifact](/artifact/individual),
generated on the syntax for `bnf`s themselves.

It is used internally in the library to parse `bnf` inputs into `SyntaxNode`s
which are then used for further compilation to either [`WasmParser`](/api/wasm/#generatewasm),
[`legacy.Parser`](/legacy/api/#parser), or [`type definitions`](/api/wasm#compiletypes)