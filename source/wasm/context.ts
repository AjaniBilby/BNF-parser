import binaryen from "binaryen";

import LiteralMapping from "~/wasm/literal-mapping.js";
import { Reference } from "~/artifacts/shared.js";
import { Rule } from "~/legacy/parser.js";

// Using OO because of better V8 memory optimisations
export class DebugInfoLine {
	expr: number;
	ref: Reference;

	constructor(expr: number, ref: Reference) {
		this.expr = expr;
		this.ref = ref;
	}
}

// Using OO because of better V8 memory optimisations
export class CompilerContext {
	readonly m: binaryen.Module;
	readonly l: LiteralMapping;
	vars: number[];

	_blocks: string[];
	_bID: number;

	_debugInfo: Array<DebugInfoLine>;
	_debugEnabled: boolean;

	constructor(m: binaryen.Module, literals: LiteralMapping, rule: Rule) {
		this.m = m;
		this.l = literals;
		this.vars = [];
		this._blocks = [];
		this._bID = 1;

		this._debugEnabled = true;
		this._debugInfo = [];
	}

	enableDebugging(state: boolean) {
		this._debugEnabled = state;
	}

	pushBlock(label?: string) {
		if (!label) label = this.reserveBlock();
		this._blocks.push(label);

		return label;
	}

	reserveBlock() {
		return `_bb${(this._bID++).toString()}`;
	}

	popBlock() {
		const out = this._blocks.pop();
		if (!out) throw new Error("Attempting to pop block when no blocks remain in context");
		return out;
	}


	declareVar(type: number) {
		const index = this.vars.length;
		this.vars.push(type);

		return index;
	}

	bindDebug(expr: number, ref: Reference) {
		if (!this._debugEnabled) return;
		this._debugInfo.push(new DebugInfoLine(expr, ref));
	}

	applyDebugInfo(funcID: number, fileID: number) {
		if (!this._debugEnabled) return;

		for (const binding of this._debugInfo) {
			this.m.setDebugLocation(funcID, binding.expr, fileID, binding.ref.line, binding.ref.col);
		}
	}
}