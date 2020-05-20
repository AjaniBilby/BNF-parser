
/**
 * @class
 * @public
 * @property {Number} line
 * @property {Number} col
 * @property {String} index
 */
class BNF_Reference {
	constructor(line = 1, col = 1, index = 0) {
		this.line  = line;
		this.col   = col
		this.index = index;
	}

	/**
	 * Creates an exact duplicate object of this reference
	 */
	duplicate() {
		return new BNF_Reference(this.line, this.col, this.index);
	}

	/**
	 * Shift the reference forward by one character
	 */
	shiftCol() {
		this.index++;
		this.col++;

		return this;
	}
	/**
	 * Shift the reference forward one line
	 */
	shiftLine(){
		this.index++;
		this.line++;
		this.col = 1;

		return this;
	}
	/**
	 * Shift the reference based on the string data
	 * @param {String} str 
	 */
	shiftByString(str) {
		for (let i=0; i<str.length; i++) {
			if (str[i] == "\n") {
				this.shiftLine();
			} else {
				this.shiftCol();
			}
		}

		return this;
	}

	/**
	 * Converts the reference to a string
	 */
	toString() {
		return `(${this.line}:${this.col})`;
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
	constructor(type, tokens, consumed, refStart, refEnd) {
		if (!(refStart instanceof BNF_Reference)) {
			throw new TypeError("refStart must be of type BNF_Reference");
		}
		if (!(refEnd instanceof BNF_Reference)) {
			throw new TypeError("refEnd must be of type BNF_Reference");
		}
		if (isNaN(consumed) || consumed < 0) {
			throw new TypeError("consumed must be a valid number")
		}

		this.type     = type;
		this.tokens   = tokens;
		this.ref = {
			start: refStart,
			end: refEnd
		};
	}

	get consumed(){
		return this.ref.end.index - this.ref.start.index;
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

	/**
	 * Creates a BNF_Tree based off a JSON input
	 * @param {Object} jsonObj A parsed JSON file
	 */
	static fromJSON(jsonObj) {
		return new BNF_Tree(jsonObj.terms);
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
		this.hasError  = res instanceof BNF_SyntaxError;
		this.isPartial = res.consumed != dataLen;
		this.tree      = res;
	}
}

module.exports = {
	BNF_SyntaxNode, BNF_SyntaxError, BNF_Reference, BNF_Tree, BNF_Parse
}