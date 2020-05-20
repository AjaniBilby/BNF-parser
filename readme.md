A simple library to parse input strings into token trees based on a BNF's description.

BNF trees must first be compiled before they can be used to parse syntax trees.

# Compilation
```js
let result = BNF.parse(file, BNF.syntax);
let tree = BNF.compile(result.tree);
```
A compiled BNF can be saved as a JSON file and reloaded later
```js
// Store the compiled result for later use
fs.writeFileSync(path, JSON.stringify(tree));

// Load the compiled BNF
let tree = BNF.fromJSON(
  JSON.parse( fs.readFileSync(path, 'utf8') )
);
```

# Parsing
Running parse will return a ``BNF_Parse`` object, which contains a tree structure of ``BNF_SyntaxNode``s. How these nodes are structured depends on the compiled BNF used to parse the syntax.


# BNF: Syntax
The BNF used by this application is a dilect of regular extensions for BNF. Most noteably it adds the not (``!``) opperator.

The BNF outlining the syntax of BNFs used by this system can be found [here](./bnf.bnf).

# BNF: Build
Provided with BNF data, this will return a BNF_Tree with error handling.

## BNF Opperator: Not
The not opperator will be consuming tokens until the operation fails. Note that a not operator with no tokens it counted as a valid not operations.