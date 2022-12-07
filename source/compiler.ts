import { ParseCount, Parser, Rule } from "./parser";
import { SyntaxNode } from "./syntax";



function BuildRule(rule: SyntaxNode): Rule {
	if (rule.type != "def") {
		throw new Error(`Unknown internal error, expected "def" got "${rule.type}"`);
	}

	return new Rule(
		(rule.value[0] as SyntaxNode).value as string,
		BuildExpr(rule.value[1] as SyntaxNode)
	);
}

function BuildExpr(expr: SyntaxNode): any {
	if (expr.type != "expr") {
		throw new Error(`Unknown internal error, expected "expr" got "${expr.type}"`);
	}

	let base: any = {
		type: "sequence",
		count: "1",
		exprs: [BuildOperand(expr.value[0] as SyntaxNode)]
	};

	for (let pair of (expr.value[1] as SyntaxNode).value as SyntaxNode[]) {
		let operator = pair.value[0] as SyntaxNode;
		let operand = BuildOperand(pair.value[1] as SyntaxNode);

		switch (operator.value) {
			case "":
			case "|":
				let desire = operator.value == "|" ? "select" : "sequence";
				if (base.type != desire) {
					if (base.type == "range" || base.exprs?.length != 1) {
						base = {
							type: desire,
							count: "1",
							exprs: [base, operand]
						};
						continue;
					} else {
						base.type = desire;
						base.exprs.push(operand);
						continue;
					}
				}

				base.exprs.push(operand);
				continue;
			case "->":
				let a = base.exprs.pop();
				if (a.type != "literal" || operand.type != "literal") {
					throw new Error(`Attempting to make a range between two non literals at ${operator.ref.toString()}`);
				}
				if (a.value.length != 1 || operand.value.length != 1) {
					throw new Error(`Attempting to make a range non single characters at ${operator.ref.toString()}`);
				}

				let action = {
					type: "range",
					value: a.value,
					to: operand.value,
					count: operand.count
				};
				if (base.exprs.length == 0) {
					base = action;
				} else {
					base.exprs.push(action);
				}

				continue;
			default:
				throw new Error(`Unknown operator "${operator.value}"`);
		}
	}

	return base;
}

function FlatternConstant(expr: SyntaxNode): string {
	if (expr.type != "constant") {
		throw new Error(`Unknown internal error, expected "constant" got "${expr.type}"`);
	}

	let str = expr.value[0] as SyntaxNode
	let inner = str.value[0] as SyntaxNode;
	let out = "";

	if (!Array.isArray(inner.value)) {
		throw new TypeError("Internal logic failure. Unexpected string");
	}

	for (let charNode of inner.value) {
		if (charNode.type == "literal") {
			out += charNode.value;
		} else {

			let esc = charNode.value as SyntaxNode[];
			switch (esc[1].value) {
				case "b": out += "\b"; break;
				case "f": out += "\f"; break;
				case "n": out += "\n"; break;
				case "r": out += "\r"; break;
				case "t": out += "\t"; break;
				case "v": out += "\v"; break;
				default: out += esc[1].value;
			}
		}
	}

	return out;
}

function BuildOperand(expr: SyntaxNode): any {
	if (expr.type != "expr_arg") {
		throw new Error(`Unknown internal error, expected "expr_arg" got "${expr.type}"`);
	}

	let component = expr.value as SyntaxNode[];
	let prefixes = component[0].value as SyntaxNode[];

	let countStr = component[2].value as string;
	let base: any = {
		count: ParseCount(countStr == "" ? "1": countStr)
	};

	switch (component[1].type) {
		case "constant":
			component[1].value = FlatternConstant(component[1] as SyntaxNode);
		case "name":
			base.type = component[1].type == "constant" ? "literal" : "term";
			base.value = component[1].value;
			break;
		case "expr_brackets":
			let res = BuildExpr(component[1].value[0] as SyntaxNode);
			res.count = base.count;
			base = res;
			break;
		default:
			throw new Error(`Unknown operand type ${component[1].type}`);
	}

	if (prefixes[2].value == "!") {
		base = {
			type: "not",
			expr: base,
			count: base.count
		};
		base.expr.count = "1";
	}
	if (prefixes[1].value == "...") {
		base = {
			type: "gather",
			expr: base
		};
	}
	if (prefixes[0].value == "%") {
		base = {
			type: "omit",
			expr: base
		};
	}

	return base;
}

export function Compile(tree: SyntaxNode): Parser {
	if (!(tree instanceof SyntaxNode)) {
		throw new TypeError("Cannot compile syntax tree, as Syntax node is not provided");
	}

	let syntax = new Parser({});

	for (let node of (tree.value[0] as SyntaxNode).value) {
		if (node instanceof SyntaxNode &&
			node.value[0] instanceof SyntaxNode
		) {
				let rule = BuildRule(node.value[0]);
				syntax.addRule(rule.name, rule);
		} else {
			throw new Error("Malformed syntax tree");
		}
	}

	syntax.link();

	return syntax;
}