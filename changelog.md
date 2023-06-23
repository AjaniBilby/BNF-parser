# Changelog

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