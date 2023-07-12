---
title: Legacy Syntax Tree Structure
search:
  exclude: true
---

# Legacy Syntax Tree Structure

!!! warning "Deprecated"

    These features are all deprecated and will not be updated  
    While they are still available within `v4.0` under the `legacy` namespace  
    However they will be phased out by the next major release

There are two primary abstractions in generating syntax trees from BNF: sequences and selections.

## Sequences

A sequence is an ordered list of elements that form a match. A top-level sequence (right side of the `::=`) will resolve with the `SyntaxNode.type` of the matching name (the name on the left of the `::=`). Sub-sequences within parentheses `()` will appear as a syntax node with the name `(...)` and will be evaluated similarly to the top level.

If a repetition marker like name+ is used, additional nodes with the type `(...)+` will be added, and their children will represent the number of times the pattern matched.

## Select

A selection will resolve as the syntax tree of the first matching option. For example, if you have the selection statement `variable | number`, and the parser matches a `variable`, it would be the same as having a `variable` in that position in the sequence.

> The selection statement will always consume the first valid option, so you should order your selection statements accordingly. For example:
> i.e.
> ```bnf
> program ::= "a" | "aa" ;
> ```
> In this case, providing the input "aa" will fail, as it will consume the single "a", and since there is no repetition, the program will end, leaving the second "a" unconsumed. As the syntax did not parse the whole string, this is considered an error. 
> See [Parser](/legacy/api#parser) for information on allowing partial matches.

## Omit

Omit statements within a sequence will be removed, and they will not be present in the output syntax tree. However, they are still crucial for a successful match. If they are within a selection, they will be visible with `SyntaxNode.type` of `omit` and no child nodes.

## Gather

Gather does not change the output syntax tree structure relative to the sequence or selection it is within. However, it combines all of its child nodes into a single string. Note that this reflects the effects of any omit operations within the child nodes.

## Not

The `SyntaxNode.values` will be a single string containing all characters consumed until it matched the target expression of the repetition limit is reached.

## Range

Ranges will appear with the `SyntaxNode.type` of `range` with `SyntaxNode.value` being a single string with the characters consumed by this expression, accounting for any repetition markers (so a range with `+` will be a string of length at least one).

## Repetition

A repetition marker creates its own node in the syntax tree, with its children representing the value of each repetition. The `SyntaxNode.type` value of this node will be the `(...)` followed by the repetition marker used, such as: `(...)+`, `(...)*`, or `(...)?`.

## Literal

Literals will appear with the `SyntaxNode.type` of `literal` and `SyntaxNode.value` as an exact copy of the literal as a string.