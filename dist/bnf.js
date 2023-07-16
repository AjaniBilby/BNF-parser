import * as _Shared from "./shared.js";
let _rawWasm = _Shared.DecodeBase64("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");
let _ctx = null;
if (typeof window === 'undefined') {
	_ctx = new WebAssembly.Instance(
		new WebAssembly.Module(
			_rawWasm
		), {js: {print_i32: console.log}}
	);
}
let ready = new Promise(async (res, rej) => {
	if (typeof window !== 'undefined') {
		_ctx = await WebAssembly.instantiate(
			await WebAssembly.compile(_rawWasm),
			{js: {print_i32: console.log}}
		);
	}

	Object.freeze(_ctx);
	_rawWasm = null;
	res();
});
export { ready };
export function Parse_Program (data, refMapping = true) {
  return _Shared.Parse(_ctx, data, refMapping, "program");
}
export function Parse_W (data, refMapping = true) {
  return _Shared.Parse(_ctx, data, refMapping, "w");
}
export function Parse_Comment (data, refMapping = true) {
  return _Shared.Parse(_ctx, data, refMapping, "comment");
}
export function Parse_Name (data, refMapping = true) {
  return _Shared.Parse(_ctx, data, refMapping, "name");
}
export function Parse_Letter (data, refMapping = true) {
  return _Shared.Parse(_ctx, data, refMapping, "letter");
}
export function Parse_Digit (data, refMapping = true) {
  return _Shared.Parse(_ctx, data, refMapping, "digit");
}
export function Parse_Hex (data, refMapping = true) {
  return _Shared.Parse(_ctx, data, refMapping, "hex");
}
export function Parse_Constant (data, refMapping = true) {
  return _Shared.Parse(_ctx, data, refMapping, "constant");
}
export function Parse_Frag (data, refMapping = true) {
  return _Shared.Parse(_ctx, data, refMapping, "frag");
}
export function Parse_Escape (data, refMapping = true) {
  return _Shared.Parse(_ctx, data, refMapping, "escape");
}
export function Parse_Byte (data, refMapping = true) {
  return _Shared.Parse(_ctx, data, refMapping, "byte");
}
export function Parse_Def (data, refMapping = true) {
  return _Shared.Parse(_ctx, data, refMapping, "def");
}
export function Parse_Expr (data, refMapping = true) {
  return _Shared.Parse(_ctx, data, refMapping, "expr");
}
export function Parse_Expr_arg (data, refMapping = true) {
  return _Shared.Parse(_ctx, data, refMapping, "expr_arg");
}
export function Parse_Expr_prefix (data, refMapping = true) {
  return _Shared.Parse(_ctx, data, refMapping, "expr_prefix");
}
export function Parse_Expr_infix (data, refMapping = true) {
  return _Shared.Parse(_ctx, data, refMapping, "expr_infix");
}
export function Parse_Expr_suffix (data, refMapping = true) {
  return _Shared.Parse(_ctx, data, refMapping, "expr_suffix");
}
export function Parse_Expr_brackets (data, refMapping = true) {
  return _Shared.Parse(_ctx, data, refMapping, "expr_brackets");
}
