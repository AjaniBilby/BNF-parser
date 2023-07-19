---
title: BNF Syntax
hide:
  - navigation
---

# Bnf Syntax

Here is the full syntax for how to write a `bnf` represented in our `bnf` format.
If you're experienced you might notice there are some slight differences making our syntax slightly more modern.
For those who aren't experienced with `bnf` syntax, don't worry we will go into it in detail.
```bnf
--8<-- "./bnf.bnf"
```

All syntax trees follow the same general structure, where all branches can only have [`SyntaxNode[]`](/api/shared#syntaxnode) as their value, and all leaves will have `string` values.

All leaf notes will have the `.type` of `literal`, no matter what their naming originally was.

## Terms

Every term must start with a name, which can be made out of letters, numbers, and `_`.
After the name you put a `::=` to start the expression, and must end it with a `;`.
This semicolon is to allow for multiline terms when things get complex.

## Sequence

All terms start with a sequence, meaning a series of things that must successfully parse for the term to be valid.
```bnf
# will only accept "ab" as input
# just "b" will fail the entire sequence
program ::= "a" "b" ;
```

## Select

A term may start with a select expression, however it will be parsed as if the term had a sequence,
of which the first element was a select. This is to help reduce how much a syntax tree layout changes with small changes to the bnf sequence.

You don't want minor tweaks to your BNF requiring major code changes due to your syntax tree now being represented majorly different.

Selects can be chained which will form one large list of options, and a select will resolve as the first child is matches with.

```bnf
program ::= "a" | "b" | "c" ;
```

This will match any single `a`, `b`, or `c` - and if it matches anyone of them the resulting syntax tree would be the same as if that option was just directly in the sequence.
```
# with input "b"
sel ::= "a" | "b" | "c" ;
seq ::= "b" ;
```
Matching either of these two terms with the input `b` will create an identical syntax tree.

!!! note "About determinism"

    A select will **always** take the first matching option, this means your option order will matter in some cases.
    ```bnf
    # input "baa"
    success ::= "baa" | "b" ;
    fail    ::= "b" | "baa" ;
    ```

### Interaction with Sequence

If you use sequences and selects in a single expression he behaviour will flip flop between the two modes accordingly.
We strongly recommend using brackets if you indent to mix these to make behaviour more clear.

```
program ::= "a" "b" | "c" "d" | "e" | "f";
resolve ::= "a" ( "b" | "c" ) ( "d" | "e" | "f" ) ;
```

## Literals

All literals as just strings of characters, these must start and end with a `"`, (i.e. `"Hello There"`).
For a literal to match successfully the **entire** literal must exactly match.

Literals also allow certain escape characters to help with encoding certain characters within a string.

| Code | Result |
| :-: | :- |
| `\b` | Backspace |
| `\f` | Form Feed |
| `\n` | New Line |
| `\r` | Carriage Return |
| `\t` | Horizontal Tab |
| `\v` | Vertical Tab |
| `\x??` | The two characters following the `\x` must be hexadecimal digits, these digits represent the character code of the character you want to match at this point (`\x6b` = `k`)|
| - | Unrecognised escapes will result in just the character after the slash |

## Range

A range will match any character between the first and last literal.
These two literals must both be a single character.
This works based on checking if the byte is in range of the byte value of the two characters.
Be mindful of this, because this will not match anything `"z"->"a"`, and this `"A"->"z"` will also match some control characters between the upper case and lowercase alphabets.
```bnf
letter ::= "a"->"z" | "A"->"Z" ;
```

## Brackets

This allows you to represent a sequence with a sequence, or even a sequence with a select.
The insides of the bracket will resolve to either a `sequence` or a `select` depending on what's inside of them
```
a ::= ( "a"   "b" ) ; # bracket resolved to a child sequence
a ::= ( "a" | "b" ) ; # bracket resolved to a child select
```

## Not

When this `!` is placed before any operand will consume the inverse of it.
For instance if you want any character that isn't a vowel.
```bnf
program ::= !( "a" | "e" | "i" | "u" | "o" ) ;
```

## Omit

This will omit `%` the resulting SyntaxNode of what ever you're applying it to from the resulting syntax tree.
This can be helpful for discarding unuseful data such as whitespace.
```bnf
program ::= name %" " name %comment ;
```

## Gather

This operator will apply on any operand, and flatten the resulting tree structure into a single string.
This can be helpful for further sanitising of the syntax tree for features you don't care about, such as the specific structure of how a name is parsed.

```
program ::= ...name ; # name will resolve name to a literal
name ::= letter letter letter ;
```

## Repetition

Repetitions can be applied at the end of any operand, and tells the parser how many times it should consume the pattern until it stops, and also it fail if it doesn't consume if enough times.
```bnf
term  # once
term? # one or zero
term+ # at least once
term* # zero or more
```

This will actually apply to certain other operations directly modifying their behaviour.
A __not__ will tell it how many characters to consume which will resolve as a single node with a multi-character string.
A __range__ will also behave similarly as not when modified.
