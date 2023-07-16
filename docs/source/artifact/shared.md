---
title: Shared Artifact
---

# Using the Shared Artifact


This artifact is actually just a clone of the [`Shared`](/api/shared) namespace within `bnf-parser` with some functions embedded from [`wasm.Runner`](/api/wasm).

Namespaces

- [`AssertUnreachable`](/api/shared#assertunreachable)
- [`DecodeBase64`](/api/shared#decodebase64)
- [`ParserError`](/api/shared#parsererror)
- [`Reference`](/api/shared#reference)
- [`ReferenceRange`](/api/shared#referencerange)
- [`SyntaxNode`](/api/shared#syntaxnode)

There are also some extra functions which are purely there for the bnf artifacts to import, and not intended for direct use

- `Decode`
- `InitParse`
- [`Parse`](/api/wasm#runnerparse)
- `MapBytes2String`
- `MapTreeRefs`
- `Offset`