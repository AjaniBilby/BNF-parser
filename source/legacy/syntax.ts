import { ParseError, Reference, ReferenceRange } from "../artifacts/shared.js";

export {
	ParseError,
	ReferenceRange,
	Reference,
};

type SyntaxValue = SyntaxNode[] | string;
export class SyntaxNode {
	type: string;
	value: SyntaxValue;
	ref: ReferenceRange;
	reach: ReferenceRange | null;

	constructor(type: string, value: SyntaxValue, ref: ReferenceRange) {
		this.type = type;
		this.ref = ref;
		this.value = value;
		this.reach = null;
	}

	getReach (): ReferenceRange | null {
		if (this.reach) {
			return this.reach;
		}

		if (typeof this.value == "string") {
			return null;
		}

		if (this.value.length == 0) {
			return null;
		}

		return this.value[this.value.length-1].getReach();
	}


	flat(): string {
		if (Array.isArray(this.value)) {
			return this.value
				.map(x => x.flat())
				.reduce((prev: string, x: string) => prev+x, "");
		} else {
			return this.value;
		}
	}
}