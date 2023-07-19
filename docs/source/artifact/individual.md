---
title: Individual Artifacts
---

# Using the BNF generated Artifact

## Types

For every term in the BNF node there will also be a type, that type name will start with `Term_`;
with the first letter of the term name capitalized. This will be a type representing the syntax structure at that node.

**Examples**
```
program  -> Term_Program
name     -> Term_Name
expr_arg -> Term_Expr_arg
```

#### Literal

There is also an added `_Literal` type, this is mainly to help developers using this library by giving them a type they can use in function arguments, and other type hints that is shorter to type than the entire type definition for a standard literal node.

### Nodes

Every node (including terms, and literals) have the following general type, which is then refined by the compiled `d.ts`
```ts
type SyntaxNode = {
  type  : string;
  root  : string | SyntaxNode[];
  start : number;                // the BYTE index this node starts at (not string index)
  end   : number;                // the BYTE index the node ends at    (not string index)
  ref   : null | ReferenceRange  // see shared artifact
}
```


## Functions

For every term in your BNF there will be a function with the following syntax.
When you supply this function with a string it will attempt to parse the string starting from the specific term in the BNF.

This means that you could actually group multiple different parsers into one artifact by including them all in the same BNF, then you just call the specific entry points for each one.

```ts
function Parse_Program(input: string, mapSource = true): {
  root       : Term_Program; // the root node of the syntax tree
  reachBytes : number;       // how many bytes where consumed
  isPartial  : boolean;      // did only part of the input parse?
}
```

### Argument `mapSource`

This is enabled by default, however if it is not enabled the `.ref` attribute will be left as `null`,
and byte to javascript string indices will not be calculated which can save time,
especially if you don't care about where the error occurred, and instead just on the syntax tree result.