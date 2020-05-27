const {BNF_SyntaxNode, BNF_SyntaxError, BNF_Reference, BNF_Tree, BNF_Parse} = require('./types.js');

function HighlightArea(input, fromRef, toRef){
  let index = fromRef.index;

  function IsInBound(col) {
    if (fromRef && toRef) {
      return fromRef.col <= col && col <= toRef.col;
    }
    if (fromRef && fromRef.col <= col) {
      return true;
    }
    if (toRef && col <= toRef.col) {
      return true;
    }
  }

  // Get the previous newline
  let begin;
  for (begin=index; 0<begin; begin--) {
    if (input[begin] == "\n") {
      begin++;
      break;
    }
  }
  // Move backforward past whitespace
  let colShift = 0;
  for (; begin<input.length; begin++){
    if (input[begin] == " " | input[begin] == "\t") {
      colShift++;
      continue;
    } else {
      break;
    }
  }

  // Get the next newline
  let end;
  for (end=index; end<input.length; end++) {
    if (input[end] == "\n") {
      break;
    }
  }

  let snippet = input.slice(begin, end);
  let area = "";
  let lineLen = end-begin;
  for (let col=1+colShift; col<lineLen+colShift; col++) {
    area += col == fromRef.col ? "^" : ( IsInBound(col) ? "~" : " ");
  }

  return snippet + "\n" + area;
}


module.exports = {
  HighlightArea
};