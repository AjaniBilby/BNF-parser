const { BNF_Tree } = require('./types.js');
const { GenerateTM } = require('../index.js');



function GenerateTextMate (tree, topLevel, langName, langExt, means) {
	if (topLevel === undefined) {
		throw new Error("Must specify top level name argument");
	}
	if (langName === undefined) {
		throw new Error("Must specify language name argument");
	}

	// Cache generated regex for certain terms
	// let cache = {};
	function GenerateRegex(term) {
		function CountStr(str) {
			switch (str) {
				case undefined:
				case "1":
					return "";
				case "*":
				case "?":
				case "+":
					return str;
			}
		}

		if (term.type == "literal") {
			return term.val+CountStr(term.count);
		} else if (term.type == "not") {
			return `?!(${GenerateRegex({type: "ref", val: term.match})})${CountStr(term.count)}`;
		} else {
			return ".*?";
		}

		// if (term.type == "literal") {
		// 	return term.val+CountStr(term.count);
		// } else if (term.type == "not") {
		// 	return `?!(${GenerateRegex({type: "ref", val: term.match})})${CountStr(term.count)}`;
		// } else {
		// 	if (cache[term.val]) {
		// 		return cache[term.val];
		// 	} else {
		// 		cache[term.val] = ".*?"; // catch for recursion
		// 	}

		// 	let target = tree.terms[term.val];
		// 	let reg = [];
		// 	if (target.type == "not") {
		// 		reg.push(`?!(${GenerateRegex({type: "ref", val: target.match})})${CountStr(target.count)}`);
		// 	} else {
		// 		for (let node of target.match) {
		// 			reg.push(GenerateRegex(node));
		// 		}
		// 	}
			

		// 	if (target.type == "select") {
		// 		reg = reg.join('|');
		// 	} else {
		// 		reg = reg.map(x => `${x}`).join('');
		// 	}

		// 	cache[term.val] = reg;
		// 	return reg+CountStr(term.count);
		// }
	}


	let out = {
		name: langName,
		scopeName: `source.${langExt}`,
		patterns: [],
		repository: {}
	};

	function GenerateRepo(name) {
		if (out.repository[name]) {
			return;
		}

		let patterns = [];
		out.repository[name] = {
			patterns: patterns
		};
		let target = tree.terms[name];
		if (target.type == "select") {
			for (let node of target.match) {
				if (node.type == "ref") {
					patterns.push({
						include: `#${node.val}`,
					});
				} else {
					patterns.push({
						match: `${node.val}`
					});
				}
			}
		} else if (target.type == "not") {
			patterns.push({
				match: GenerateRegex(target)
			});
		} else {
			let pat = {
				name: means[name],
				match: "",
				capture: {}
			};


			let i = 0;
			for (let node of target.match) {
				pat.match += `(${GenerateRegex(node)})`;
				if (node.type == "ref") {
					pat.capture[i] = {
						patterns: [ {include: `#${node.val}`} ]
					};
					GenerateRepo(node.val);
				}
				i++;
			}

			patterns.push(pat);
		}
	}

	// Check the starting point type is valid
	if (tree.terms[topLevel].type != "select") {
		throw new Error("Argument topLevel must specify a select type term");
	}

	// Generate the pattern match for all required patterns
	for (let node of tree.terms[topLevel].match) {
		out.patterns.push({ include: `#${node.val}`});
		GenerateRepo(node.val);
	}

	return out;
}

module.exports = GenerateTextMate;