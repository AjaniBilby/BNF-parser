# BNF-Parser <!-- no toc -->

[![Test](https://github.com/AjaniBilby/BNF-parser/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/AjaniBilby/BNF-parser/actions/workflows/test.yml)

Compile your bnfs down to WebAssembly for maximum parsing speed; with generated type definitions to make using the syntax tree outputs a breeze. The compiled output from this library is platform agnostic, so it can run anywhere `new WebAssembly.Instance()` is a valid function. It bundles the WebAssembly module inside of a single js file so it can be easily incorporated into any bundler. The type definitions for a given bnf are just that, a definitions file - so if you don't want to use typescript or type hints you can go wild by ignoring it.


```bnf
program ::= chunk+ ;
chunk ::= "a"+ "b"+ ;
```
```bash
npx bnf-compile ./syntax.bnf
```
```ts
import * as syntax from "./bnf/syntax.js";

const tree    = syntax.Parse_Program("abbaabab").root;
const chunk   = program.value[0]; // typescript knows this this **will** be of type `Term_Chunk`
const firstBs = program.value[1];
const bCount: number = firstBs.value.length; // typescript knows this **will** be a number
```

**Built to be a devDependency** - if you use the included cli tool to generate your syntax parser you don't need to include this library as your dependency, you can just import those artifacts.

## Documentation

See [https://bnf-parser.ajanibilby.com/](https://bnf-parser.ajanibilby.com/)

## API

See [https://bnf-parser.ajanibilby.com/api](https://bnf-parser.ajanibilby.com/api)

## BNF Syntax

See [https://bnf-parser.ajanibilby.com/api](https://bnf-parser.ajanibilby.com/syntax)

## Try it Online

Try it in your browser [https://bnf-parser.ajanibilby.com/test](https://bnf-parser.ajanibilby.com/test)