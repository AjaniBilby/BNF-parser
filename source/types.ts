import type { Count, Expression, Literal, Parser, Rule, Select, Term } from '~/legacy/parser.js';
import { Sequence } from '~/legacy/parser.js';



function CompileExpression(expr: Expression, name?: string): string {
	switch (expr.constructor.name) {
		case 'Sequence':  return CompileSequence(expr as Sequence, name);
		case 'Select':    return CompileSelect  (expr as Select);
		case 'Literal':   return CompileLiteral (expr as Literal);
		case 'Term':      return CompileTerm    (expr as Term);
		case 'CharRange': return CompileRange   ();
		case 'Omit':      return CompileOmit    ();
		case 'Not':       return CompileNot     ();
		case 'Gather':    return CompileGather  ();
	}

	throw new Error(`Unexpected expression type ${expr.constructor.name} during compilation`);
}


function CompileSequence(expr: Sequence, name?: string): string {
	const once = CompileSequenceOnce(expr, name);

	if (expr.count === '1') {
		return once;
	} else {
		return CompileRepeat(once, expr.count);
	}
}

function CompileSequenceOnce(expr: Sequence, name?: string): string {
	return `{\n\ttype: '${name || '(...)'}',\n\tstart: number,\n\tend: number,\n\tcount: number,\n\tref: _Shared.ReferenceRange,\n\tvalue: [\n` +
		expr.exprs
			.map(x => CompileExpression(x))
			.filter(x => x.length > 0)
			.map(x => '\t\t' + x)
			.join(',\n') +
		'\n\t]\n}';
}


function CompileSelect(expr: Select): string {
	const once = CompileSelectOnce(expr);

	if (expr.count === '1') {
		return once;
	} else {
		return CompileRepeat(once, expr.count);
	}
}

function CompileSelectOnce(expr: Select): string {
	return '(' +
		expr.exprs
			.map(x => CompileExpression(x))
			.filter(x => x.length > 0)
			.join(' | ') +
		')';
}


function CompileOmit(): string {
	return '';
}

function CompileGather(): string {
	return "_Literal";
}


function CompileTerm(expr: Term): string {
	const once = CompileTermOnce(expr);

	if (expr.count === '1') {
		return once;
	} else {
		return CompileRepeat(once, expr.count);
	}
}

function CompileTermOnce(expr: Term): string {
	return 'Term_' + expr.value[0].toUpperCase() + expr.value.slice(1);;
}


function CompileNot(): string {
	return "_Literal";
}

function CompileRange(): string {
	return "_Literal";
}



function CompileLiteral(expr: Literal): string {
	const once = CompileLiteralOnce(expr);

	if (expr.count === '1') {
		return once;
	} else {
		return CompileRepeat(once, expr.count);
	}
}

function CompileLiteralOnce(expr: Literal): string {
	let safe = expr.value.replace(/[^a-zA-Z0-9]/g,
		(char) => '\\x' + char.charCodeAt(0).toString(16).padStart(2, '0')
	);

	return `_Literal & {value: "${safe}"}`;
}


function CompileRepeat(innerType: string, repetitions: Count): string {
	switch (repetitions) {
		case "1": throw new Error(`Don't compile repetitions for 1 to 1 repetition`);
		case "?": return TemplateNode(`'(...)?'`, `[] | [${innerType}]`);
		case "+": return TemplateNode(`'(...)+'`, `[${innerType}] & Array<${innerType}>`);
		case "*": return TemplateNode(`'(...)*'`, `Array<${innerType}>`);
		default: throw new Error(`Unexpected count type ${repetitions}`);
	}
}


function TemplateNode(type: string, value: string) {
	return `{ type: ${type}, value: ${value}, start: number, end: number, count: number, ref: _Shared.ReferenceRange }`
}





function CompileRule(rule: Rule) {
	// Make sure all rules start with a sequence
	let inner = rule.seq;
	if (inner.constructor.name === 'Select') {
		let child: Expression = inner as Select;
		if (child.exprs.length === 1) child = child.exprs[0];

		inner = new Sequence({
			exprs: [],
			count: '1'
		});
		inner.exprs = [ child ];
	} else if (rule.seq.constructor.name !== 'Sequence') {
		inner = new Sequence({
			exprs: [],
			count: '1'
		});
		inner.exprs = [ rule.seq ];
	}

	const capName = rule.name[0].toUpperCase() + rule.name.slice(1);
	const typeName = `Term_${capName}`;
	return `export type ${typeName} = ${CompileExpression(inner, rule.name)}\n` +
		`export declare function Parse_${capName} (i: string, refMapping?: boolean): _Shared.ParseError | {\n\troot: _Shared.SyntaxNode & ${typeName},\n\treachBytes: number,\n\treach: null | _Shared.Reference,\n\tisPartial: boolean\n}\n`;
}


export function CompileTypes(lang: Parser) {
	return `import type * as _Shared from './shared.js';\n`+
		`export type _Literal = { type: "literal", value: string, start: number, end: number, count: number, ref: _Shared.ReferenceRange };\n` +
		[...lang.terms.keys()]
			.map(x => CompileRule(lang.terms.get(x) as any)) // hush Typescript it's okay
			.join('\n');
}