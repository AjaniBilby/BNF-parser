---
title: Legacy Introduction
---

# Introduction

!!! warning "Deprecated"

    These features are all deprecated and will not be updated  
    While they are still available within `v4.0` under the `legacy` namespace  
    However they will be phased out by the next major release

BNF-Parser is a simple library for generating syntax parsers based on deterministic BNF syntax descriptions. It includes a few changes from standard BNF forms to help produce cleaner syntax tree outputs.


## Example

First, provide the BNF representation of your language and parse it into a syntax tree. Then, compile the tree into a representation that is ready to parse syntax trees for the compiled language.

```js
import { legacy } from "bnf-parser";

let result = legacy.BNF.parse(LANGUAGE_BNF);
let tree = legacy.Compile(result);

let syntax = tree.parse(FILE);
```

You can save a compiled BNF as a JSON file and reload it later:
```js
// Save the syntax tree
fs.writeFileSync(path, JSON.stringify(tree.serialize()));

// Load the compiled syntax tree
let tree = new legacy.Parser(
  JSON.parse( fs.readFileSync(path, 'utf8') )
);
```