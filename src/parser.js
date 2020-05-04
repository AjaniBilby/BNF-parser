const {BNF_SyntaxNode, BNF_SyntaxError, BNF_Reference, BNF_Tree, BNF_Parse} = require('./types.js');


function Process_Literal_String (string) {
	return string.replace(/\\t/g, "\t")
	.replace(/\\r/g, "\r")
	.replace(/\\n/g, "\n")
	.replace(/\\"/g, "\"")
	.replace(/\\\\/g, "\\");
}

function Process_Select   (input, tree, branch, stack = [], level = 0){

	for (let target of branch.match) {
		if (target.type == "literal") {
			if (input.slice(0, target.val.length) == target.val) {
				return new BNF_SyntaxNode (branch.term, Process_Literal_String(target.val), target.val.length);
			}
		} else if (target.type == "ref") {
			let res = Process(input, tree, target.val, [...stack], level+1);
			if (res instanceof BNF_SyntaxNode) {
				return new BNF_SyntaxNode(branch.term, [res], res.consumed);
			}
		} else {
			throw new Error(`Malformed tree: Invalid match type ${target.type}`);
		}
	}

	return new BNF_SyntaxError(new BNF_Reference(0,0), input, branch, "PSL_1");
}
function Process_Sequence(input, tree, branch, stack = [], level = 0) {

	function MatchOne(target, string) {
		if (target.type == "literal") {
			if (string.slice(0, target.val.length) == target.val) {
				return new BNF_SyntaxNode("literal", [Process_Literal_String(target.val)], target.val.length);
			} else {
				return new BNF_SyntaxError(new BNF_Reference(0, 0), string, branch, "PSQ_O_1");
			}
		} else if (target.type == "ref") {
			return Process(string, tree, target.val, [...stack], level + 1);
		}

		throw new Error(`Malformed tree: Invalid selector match type ${target.type}`);
	}

	function MatchZeroToMany(target, string) {
		let sub = [];
		let res;

		while (!(res instanceof BNF_SyntaxError)) {
			res = MatchOne(target, string);

			if (res instanceof BNF_SyntaxNode) {
				string = string.slice(res.consumed);
				sub.push(res);

				// Stop consuming 0 tokens infinitly
				// But at least consume it once as it is a valid parse for ==1 >=1
				if (res.consumed == 0) {
					break;
				}
			}
		}

		return sub;
	}

	let consumed = 0;
	let out = [];
	for (let target of branch.match) {
		if (!target.count) { target.count = "1"; } // lazy load
		let sub = [];

		// Match tokens
		if (target.count == "?" || target.count == "1") {
			let res = MatchOne(target, input);
			if (res instanceof BNF_SyntaxNode) {
				sub = [res];
			} else {
				sub = [];
			}
		} else if (target.count == "*" || target.count == "+") {
			sub = MatchZeroToMany(target, input);
		}

		// Check number of tokens
		if (sub.length == 0 && ( target.count == "+" || target.count == "1" )) {
			return new BNF_SyntaxError(new BNF_Reference(0, 0), input, {...branch, stage: target}, "PSQ_1");
		}

		// Shift the search point forwards to not search consumed tokens
		let shift = 0;
		if (sub.length > 0) {
			shift = sub.reduce((prev, curr) => {
				return ( prev instanceof BNF_SyntaxNode ? prev.consumed : prev ) + curr.consumed;
			});
			if (shift instanceof BNF_SyntaxNode) {
				shift = shift.consumed;
			}
		}
		input = input.slice(shift);
		consumed += shift;

		out.push(sub);
		stack = [];
	}

	return new BNF_SyntaxNode(branch.term, out, consumed);
}
function Process_Not(input, tree, branch, stack = [], level = 0) {
	let ran = false;
	let res = false;
	let out = "";

	while (!(res instanceof BNF_SyntaxNode)) {
		if (input.length == 0) {
			break;
		}

		res = Process(input, tree, branch.match, [...stack], level + 1);

		if (res instanceof BNF_SyntaxError) {
			ran = true;
			out += input[0];
			input = input.slice(1);
			stack = [];
		}

	}

	return new BNF_SyntaxNode(branch.term, out, out.length);
}


function Process (input, tree, term, stack = [], level = 0) {
	let branch = tree.terms[term];
	if (!branch) {
		console.error(term);
		throw new Error(`Malformed Tree: Unknown branch name ${term} of tree`);
	}

	branch.term = term;

	// Infinite loop detection
	let i = stack.indexOf(term);
	if (i != -1) {
		// Allow one layer of recursion
		if (stack.slice(i+1).indexOf(term) != -1) {
			throw new Error("Malformed BNF: BNF is not deterministic")
		}
	}
	stack.push(term);

	if (branch === undefined) {
		throw new Error(`Invalid tree term "${term}"`);
	}

	if (branch.type == "select") {
		return Process_Select(input, tree, branch, stack, level);
	} else if (branch.type == "sequence") {
		return Process_Sequence(input, tree, branch, stack, level);
	} else if (branch.type == "not") {
		return Process_Not(input, tree, branch, stack, level);
	} else {
		throw new Error(`Malformed tree: Invalid term type ${branch.type}`);
	}

	throw new Error("Unknown run time error");
}





/**
 * The supplied string will be turned into a token tree as specified by the tree
 * @param {String} data 
 * @param {BNF_Tree} tree BNF tree
 * @param {String} entry 
 * @returns {BNF_Parse}
 */
function Parse(data, tree, entry="program") {
	let res = Process(data, tree, entry);
	return new BNF_Parse(res, data.length);
}

module.exports = Parse;