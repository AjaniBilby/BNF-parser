const {BNF_SyntaxNode, BNF_SyntaxError, BNF_Reference, BNF_Tree, BNF_Parse} = require('./types.js');


function Process_Literal_String (string) {
	return string.replace(/\\t/g, "\t")
	.replace(/\\r/g, "\r")
	.replace(/\\n/g, "\n")
	.replace(/\\"/g, "\"")
	.replace(/\\\\/g, "\\");
}

function Process_Select   (input, tree, branch, stack = [], ref){
	for (let target of branch.match) {
		if (target.type == "literal") {
			if (input.slice(0, target.val.length) == target.val) {
				return new BNF_SyntaxNode (
					branch.term,
					Process_Literal_String(target.val),
					target.val.length,
					ref,
					ref.duplicate().shiftByString(target.val)
				);
			}
		} else if (target.type == "ref") {
			let res = Process(input, tree, target.val, [...stack], ref);
			if (res instanceof BNF_SyntaxNode) {
				return new BNF_SyntaxNode(branch.term, [res], res.consumed, ref, res.ref.end);
			}
		} else {
			throw new TypeError(`Malformed tree: Invalid match type ${target.type}`);
		}
	}

	return new BNF_SyntaxError(ref, input, branch, "PSL_1");
}
function Process_Sequence(input, tree, branch, stack = [], localRef) {
	let startRef = localRef.duplicate();

	function MatchOne(target, string, localRef) {		
		if (target.type == "literal") {
			if (string.slice(0, target.val.length) == target.val) {
				return new BNF_SyntaxNode(
					"literal",
					[ Process_Literal_String(target.val) ],
					target.val.length,
					localRef,
					localRef.duplicate().shiftByString(target.val)
				);
			} else {
				return new BNF_SyntaxError(localRef, string, branch, "PSQ_O_1");
			}
		} else if (target.type == "ref") {
			return Process(string, tree, target.val, [...stack], localRef);
		}

		throw new ReferenceError(`Malformed tree: Invalid selector match type ${target.type}`);
	}

	function MatchZeroToMany(target, string, localRef) {
		let sub = [];
		let res;

		while (!(res instanceof BNF_SyntaxError)) {
			res = MatchOne(target, string, localRef.duplicate());

			if (res instanceof BNF_SyntaxNode) {
				localRef = res.ref.end;
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
			let res = MatchOne(target, input, localRef.duplicate());
			if (res instanceof BNF_SyntaxNode) {
				sub = [res];
			} else {
				sub = [];
			}
		} else if (target.count == "*" || target.count == "+") {
			sub = MatchZeroToMany(target, input, localRef.duplicate());
		}

		// Check number of tokens
		if (
			sub.length == 0 ? ( target.count == "+" || target.count == "1" ) : false ||
			sub.length > 1  ? ( target.count == "1" || target.count == "?" ) : false
		) {
			return new BNF_SyntaxError(localRef, input, {...branch, stage: target}, "PSQ_1");
		}

		// Shift the search point forwards to not search consumed tokens
		let shift = 0;
		if (sub.length > 0) {
			localRef = sub[sub.length-1].ref.end;

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

	return new BNF_SyntaxNode(branch.term, out, consumed, startRef, localRef);
}
function Process_Not(input, tree, branch, stack = [], localRef) {
	let ran = false;
	let res = false;
	let out = "";

	let startRef = localRef.duplicate();

	let atLeastOne = branch.count == "+" || branch.count == "1";
	let atMostOne = branch.count == "?" || branch.count == "1";

	while (!(res instanceof BNF_SyntaxNode)) {
		if (input.length == 0) {
			break;
		}

		// Stop at one
		if (atMostOne && out.length >= 1) {
			break;
		}

		res = Process(input, tree, branch.match, [...stack], localRef);

		if (res instanceof BNF_SyntaxError) {
			ran = true;
			out += input[0];
			localRef.shiftByString(input[0]);

			input = input.slice(1);
			stack = [];
		}

	}

	if (
		(atMostOne ? (out.length <= 1) : true) &&
		(atLeastOne ? (1 <= out.length) : true)
	) {
		return new BNF_SyntaxNode(branch.term, out, out.length, startRef, localRef);
	} else {
		return new BNF_SyntaxError(localRef, input, {...branch, stage: branch.term}, "PN_1");
	}
}


function Process (input, tree, term, stack = [], ref) {
	let branch = tree.terms[term];
	if (!branch) {
		console.error(term);
		throw new ReferenceError(`Malformed Tree: Unknown branch name ${term} of tree`);
	}

	branch.term = term;

	// Infinite loop detection
	let i = stack.indexOf(term);
	if (i != -1) {
		// Allow one layer of recursion
		if (stack.slice(i+1).indexOf(term) != -1) {
			throw new EvalError("Malformed BNF: BNF is not deterministic")
		}
	}
	stack.push(term);

	if (branch === undefined) {
		throw new ReferenceError(`Invalid tree term "${term}"`);
	}

	if (!(ref instanceof BNF_Reference)) {
		ref = new BNF_Reference();
	}

	// Duplicate the reference so the following functions won't modify the original
	let forwardRef = ref.duplicate();

	if (branch.type == "select") {
		return Process_Select(input, tree, branch, stack, forwardRef);
	} else if (branch.type == "sequence") {
		return Process_Sequence(input, tree, branch, stack, forwardRef);
	} else if (branch.type == "not") {
		return Process_Not(input, tree, branch, stack, forwardRef);
	} else {
		throw new ReferenceError(`Malformed tree: Invalid term type ${branch.type}`);
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
	let ref = new BNF_Reference();

	let res = Process(data, tree, entry, [], ref);
	return new BNF_Parse(res, data.length);
}

module.exports = Parse;