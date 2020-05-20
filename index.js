let Compile = require('./src/compiler.js');
let Parse = require('./src/parser.js');
let Message = require('./src/message.js');
let types = require('./src/types.js');

const path = require('path');
const fs = require('fs');

let file = path.join(__dirname, './bnf.json');

let syntax = types.BNF_Tree.fromJSON(
  JSON.parse(fs.readFileSync(file, 'utf8'))
);

module.exports = {Compile, Parse, types, syntax, Message};