const { BNF, Compile } = require("../bin/index.js");
const path = require("path");
const fs = require('fs');

let input = fs.readFileSync(path.join(__dirname, './clean-bnf.bnf'), 'utf8');

let res = BNF.parse(input);
let syntax = Compile(res);

fs.writeFileSync('dump.bnf', syntax.random());