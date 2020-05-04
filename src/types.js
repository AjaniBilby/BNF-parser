
/**
 * @class
 * @public
 * @property {Number} line
 * @property {Number} col
 * @property {String} internal
 */
class BNF_Reference {
	constructor(line, col, internal) {
		this.line = line;
		this.col = col
		this.internal = internal;
	}
};

/**
 * @class
 * @pubilc
 * @property {BNF_Reference} ref
 * @property {String} remaining
 * @property {Object} branch
 * @property {String} code
 */
class BNF_SyntaxError {
	constructor(ref, remaining, branch, code=null){
		this.ref = ref;
		this.remaining = remaining;
		this.branch = branch;
		this.code = code;
	}
}

/**
 * @class
 * @public
 * @property {String} type
 * @property {String|BNF_SyntaxNode[][]} tokens
 * @property {Number} consumed
 */
class BNF_SyntaxNode {
	constructor(type, tokens, consumed) {
		this.type     = type;
		this.tokens   = tokens;
		this.consumed = consumed;
	}
}

/**
 * @class
 * @private
 * @property {Object} terms
 */
class BNF_Tree {
	constructor(terms = {}) {
		this.terms = terms;
	}
}

/**
 * @class
 * @public
 * @property {BNF_SyntaxNode} tree
 * @property {Boolean} isPartial
 * @property {Boolean} hasError
 */
class BNF_Parse {
	constructor(res, dataLen) {
		this.hasError  = res instanceof SyntaxError;
		this.isPartial = res.consumed != dataLen;
		this.tree      = res;
	}
}

module.exports = {
	BNF_SyntaxNode, BNF_SyntaxError, BNF_Reference, BNF_Tree, BNF_Parse
}