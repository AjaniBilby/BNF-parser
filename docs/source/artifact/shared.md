---
title: Shared Artifact
---

# Using the Shared Artifact


This artifact is actually just a clone of the `Shared` namespace within `bnf-parser` with some functions embedded from `wasm.Runner`.

Namespaces

- `ParserError`
- `SyntaxNode`
- `ReferenceRange`
- `Reference`
- `DecodeBase64`

There are also some extra functions which are purely there for the bnf artifacts to import, and not intended for direct use

- `InitParse`
- `MapBytes2String`
- `MapTreeRefs`
- `Parse`
- `Decode`