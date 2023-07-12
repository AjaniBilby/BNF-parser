---
title: Home
search:
  exclude: true
hide:
  - navigation
  - toc
---

# BNF Parser

!!! danger "Pre-Release Warning"

    This documentation is for the 4.0 version of `bnf-parser` which is still in pre-release  
    For documentation for the current legacy version please go [here](/legacy)

[![Reflection Test](https://github.com/AjaniBilby/BNF-parser/actions/workflows/npm-load-check.yml/badge.svg?branch=master)](https://github.com/AjaniBilby/BNF-parser/actions/workflows/npm-load-check.yml)
[![Test](https://github.com/AjaniBilby/BNF-parser/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/AjaniBilby/BNF-parser/actions/workflows/test.yml)

Compile your bnfs down to WebAssembly for maximum parsing speed; with generated type definitions to make using the syntax tree outputs a breeze. The compiled output from this library is platform agnostic, so it can run anywhere `new WebAssembly.Instance()` is a valid function. It bundles the WebAssembly module inside of a single js file so it can be easily incorporated into any bundler. The type definitions for a given bnf are just that, a definitions file - so if you don't want to use typescript or type hints you can go wild by ignoring it.

```bnf
program ::= %w* statement+ ;
block ::= %("block" w+) ...name %(w* "{" w*) seq_stmt* %("}" w*) ;
```
```ts
const tree = syntax.program(input).root;
const block = program.value[0];
const name: string = block.value[0]; // typescript knows this **will** be a string
```

**Built to be a devDependency** - if you use the included cli tool to generate your syntax parser you don't need to include this library as your dependency, you can just import those artifacts.