let Compile = require('./src/compiler.js');
let Parse = require('./src/parser.js');
let Message = require('./src/message.js');
let types = require('./src/types.js');

const path = require('path');
const fs = require('fs');

let file = path.join(__dirname, './bnf.json');

const BNF_SYNTAX = types.BNF_Tree.fromJSON(
  JSON.parse(fs.readFileSync(file, 'utf8'))
);


function Build (data, filename, syntax = BNF_SYNTAX){
  // Parse the file and check for errors
  let parse;
  try {
    parse = Parse(data, syntax);
  } catch(e) {
    throw new Error(`An internal error occured when attempting to parse the data;\n  ${e}`)
  }

  if (parse.hasError || parse.isPartial) {	
    let ref = null;
    if (parse.tree instanceof types.BNF_SyntaxError) {
      ref = parse.tree.ref;
    } else {
      ref = parse.tree.ref.end;
    }

    let msg = filename ? `${filename}: ` : "";
    msg += `BNF did not parse correctly due to a syntax error at ${ref.toString()}\n`;
    msg += "  " + Message.HighlightArea(data, ref).split('\n').join('\n  ');
    throw new SyntaxError(msg);
  }

  // Compile the parsed result into a new tree
  let output;
  try {
    output = Compile(parse.tree);
  } catch(e) {
    throw new Error(`Compile Error: An internal error occured when attempting to compile the BNF tree;\n  ${e}`);
  }

  return output;
}

module.exports = {Compile, Parse, Build, types, BNF_SYNTAX, Message};