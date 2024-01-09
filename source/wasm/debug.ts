import binaryen from "binaryen";
import { Reference } from "~/artifacts/shared.js";

export class DebugInfo {
	fileID: number;
	funcID: number;
	ref: Reference;

	constructor(fileID: number, funcID: number, ref: Reference) {
		this.fileID = fileID;
		this.funcID = funcID;
		this.ref = ref;
	}

	apply(ctx: binaryen.Module, expr: number) {
		ctx.setDebugLocation(this.funcID, expr, this.fileID, this.ref.line, this.ref.col)
	}
}


export function ForwardDebug(info: DebugInfo | undefined, ref: Reference) {
	if (!info) return undefined;

	return new DebugInfo(info.fileID, info.funcID, ref)
}