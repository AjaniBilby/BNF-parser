import { ParseCount, Parser, Rule } from "./parser";
import { SyntaxNode } from "./syntax";



function BuildRule(rule: SyntaxNode): Rule {
	return new Rule(
		(rule.value[0] as SyntaxNode).value as string,
		BuildExpr(rule.value[1] as SyntaxNode)
	);
}

function BuildExpr(expr: SyntaxNode): any {
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
					if (base.exprs?.length != 1) {
						base = {
							type: desire,
							count: "1",
							exprs: [base, operand]
						};
						continue;
					}

					base.type = desire;
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

function BuildOperand(expr: SyntaxNode): any {
	let component = expr.value as SyntaxNode[];
	let prefixes = component[0].value as SyntaxNode[];

	let countStr = component[2].value as string;
	let base: any = {
		count: ParseCount(countStr == "" ? "1": countStr)
	};

	switch (component[1].type) {
		case "constant":
			component[1].value = (component[1].value as string)
				.replace(/\\t/g, "\t")
				.replace(/\\n/g, "\n")
				.replace(/\\r/g, "\r")
				.replace(/\\"/g, "\"")
				.replace(/\\'/g, "\'")
				.replace(/\\\\/g, "\\");
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

	return syntax;
}