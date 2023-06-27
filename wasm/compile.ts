import binaryen from "binaryen";
import { readFileSync, writeFileSync } from "fs";

// Create a module with a single function
var myModule = new binaryen.Module();
myModule.setMemory(1, 1);

const encoder = new TextEncoder();

const syntaxFuncParams = binaryen.createType([binaryen.i32]);



const encoded = encoder.encode("Hello, Web");
myModule.setMemory(1, 10, "memory", [
	{
		data: encoded,
		offset: myModule.i32.const(0)
	}
]);

myModule.addGlobal("input", binaryen.i32, false, myModule.i32.const(encoded.byteLength));
myModule.addGlobal("inputLength", binaryen.i32, true, myModule.i32.const(0));
myModule.addGlobal("heap", binaryen.i32, true, myModule.i32.const(0));
myModule.addGlobal("reach", binaryen.i32, true, myModule.i32.const(0));
myModule.addGlobalExport("input", "input");
myModule.addGlobalExport("reach", "reach");
myModule.addGlobalExport("inputLength", "inputLength");

myModule.addFunctionImport("print_i32", "js", "print_i32", binaryen.createType([binaryen.i32]), binaryen.none);


myModule.addFunction("_roundWord", syntaxFuncParams, binaryen.i32, [], myModule.block(null, [
	myModule.return(
		myModule.i32.and(
			myModule.i32.add(
				myModule.local.get(0, binaryen.i32),
				myModule.i32.const(3)
			),
			myModule.i32.const(-4)
		)
	)
]));


myModule.addFunction("_init", binaryen.none, binaryen.i32, [], myModule.block(null, [
	myModule.global.set("heap",
		myModule.call("_roundWord", [
			myModule.i32.add(
				myModule.global.get("inputLength", binaryen.i32),
				myModule.global.get("input", binaryen.i32),
			)
		], binaryen.i32)
	),
	myModule.global.set("reach", myModule.i32.const(0)),
	myModule.return(
		myModule.global.get("heap", binaryen.i32)
	)
]));
myModule.addFunctionExport("_init", "_init");


myModule.addFunction(
	"program", syntaxFuncParams, binaryen.none, [],
	myModule.block(null, [
		myModule.i32.store(
			0, 4,
			myModule.global.get("heap", binaryen.i32),
			myModule.call("matchString", [
				myModule.local.get(0, binaryen.i32),
				myModule.i32.const(0),
				myModule.i32.const(encoded.byteLength),
			], binaryen.i32)
		)
	]
));
myModule.addFunctionExport("program", "program");

myModule.addFunction(
	"matchString", binaryen.createType([binaryen.i32, binaryen.i32, binaryen.i32]), binaryen.i32, [
		binaryen.i32
	],
	myModule.block(null, [
		myModule.local.set(3, myModule.i32.const(0)),

		myModule.block("outer", [
			myModule.loop("loop", myModule.block(null, [
				myModule.call("print_i32", [
					myModule.local.get(3, binaryen.i32)
				], binaryen.none),
				myModule.br_if("outer",
					myModule.i32.ne(
						myModule.i32.load8_u(0, 1,
							myModule.i32.add(
								myModule.local.get(0, binaryen.i32),
								myModule.local.get(3, binaryen.i32)
							)
						),
						myModule.i32.load8_u(0, 1,
							myModule.i32.add(
								myModule.local.get(1, binaryen.i32),
								myModule.local.get(3, binaryen.i32)
							)
						),
					),
				),
				myModule.local.set(3,
					myModule.i32.add(
						myModule.local.get(3, binaryen.i32),
						myModule.i32.const(1)
					)
				),
				myModule.br_if("outer",
					myModule.i32.ge_s(
						myModule.i32.add(
							myModule.local.get(1, binaryen.i32),
							myModule.local.get(3, binaryen.i32),
						),
						myModule.local.get(2, binaryen.i32)
					)
				),
				myModule.br_if("outer",
					myModule.i32.ge_s(
						myModule.i32.add(
							myModule.local.get(0, binaryen.i32),
							myModule.local.get(3, binaryen.i32),
						),
						myModule.global.get("heap", binaryen.i32)
					)
				),
				myModule.br("loop")
			]))
		]),
		myModule.local.get(3, binaryen.i32)
	]
));

// Optimize the module using default passes and levels
// myModule.optimize();

// Validate the module
// if (!myModule.validate())
// 	throw new Error("validation error");

// Generate text format and binary
var textData = myModule.emitText();
writeFileSync("out.wat", textData);

var wasmData = myModule.emitBinary();
writeFileSync("out.wasm", wasmData);