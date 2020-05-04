let Compile = require('./src/compiler.js');
let Parse = require('./src/parser.js');
let types = require('./src/types.js');

const fs = require('fs');

let syntax = BNF_Tree.fromJSON(
  JSON.parse(fs.readFileSync('./bnf.json', 'utf8'))
);

module.exports = {Compile, Parse, types, syntax};