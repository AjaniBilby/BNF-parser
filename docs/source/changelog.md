# Changelog

## Version 4.1.1

### Fixes:
  - [x] Fixed an issue where wasm memory usage exceeded predicted usage - the module now checks if it's about to run out of memory on the start of every rule being parsed.

## Version 4.1.0

### Added:
  - [x] Added the optional extra argument for an output dir to the cli

## Version 4.0.7

### Fixes:
  - [x] Slightly altered the import of `shared.js` from `[syntax].js` to handle better with Deno compatibility

## Version 4.0.6

### Fixes:
  - [x] References generated on successful pass not having the correct start reference

## Version 4.0.5

### Fixes:
  - [x] Hexadecimal characters weren't encoding correctly (`\x6b` == `k`)
  - [x] Reduced changes of wasm infinitely allocating to basically zero (as long as you don't try and parse an infinite string)
  - [x] CLI doesn't crash when given an invalid starting path
  - [x] Removed small chance matching could be attempted in the `0`-`7`byte gap after the input string and before the heap starts

### Changes:
  - [x] CLI now has coloured outputs
  - [x] Binaryen now validates modules after compilation to expose any potential errors in the build chain
  - [x] A lot more automated tests to ensure past errors do not occur again, and to prevent some future ones

## Version 4.0.4

### Fixes:
  - [x] Memory over growth: Available memory kept growing after every single parse
  - [x] Better error handling for `bnf-compile` when given a bad directory

## Version 4.0.3

### Additions:
  - [x] `_Literal` helper type in compiled artifacts

## Version 4.0.2

### Fixes:
  - [x] More consistent formatting for generated artifacts
  - [x] More concise types for repetitions (i.e. one to many will always have at least one element according to the type)
  - [x] Consistent file formatting (everything is LF now)

### Changes:
  - [x] Changed to MIT license from ISC

## Version 4.0.1

### Fixes:
  - [x] NPM didn't include some critical files for some reason...

## Version 4.0.0

### Additions
  - [x] Compile BNFs down to WebAssembly
  - [x] Generate type definitions for the syntax tree of a given BNF
  - [x] Now able to represent characters by char code using hexadecimal in literals (wasm only) `\x41`

### Changes:
  - [x] All previous APIs moved under the `legacy` namespace
  - [x] Changed package type to module

### Fixes:
  - [x] Count not working when applied directly to a range (i.e. `"a"->"z"+`)

## Version 3.1.6

### Patch:
 - [x] NPM ignore some how removed `/bin/lib`

## Version 3.1.5

### Tweaks:
 - [x] Better webpack support  
    No reliance on `fs` for deployment.  
    Now generates a javascript file containing all start up requirements.

## Version 3.1.4

### Tweaks:
 - [x] Added extra test case `Sequalize`
 - [x] Clarified readme documentation further
 - [x] Synced up some documentation inconsistencies between NPM and Github
 - [x] Fixed typo in previous version number's changelog
 - [x] Got ChatGPT-4 to read my homework (read over the readme and helped clarify a few things)

## Version 3.1.3

### Fixes:
 - [x] Fixed missing bound check on getting reach of a SyntaxNode

### Tweaks:
 - [x] Clarified readme documentation

## Version 3.1.2
### Fixes:
 - [x] Updated readme to clarify behaviour of select statements

## Version 3.1.1
### Fixes:
 - [x] Incorrect referencing for syntax errors.

## Version 3.1.0

### Added:
 - [x] Documentation dictating the syntax tree structure generated

### Changes:
 - [x] Updates to test case logging
 - [x] New internal string parsing method
 - [x] Rearranged documentation
 - [x] Runtime type check on `Compile` for non TS users
 - [x] Restructured output Syntax tree to make the layout more stable over BNF changes.