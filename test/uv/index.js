import * as Shared from "../bnfs/shared.js";
import * as bnf from "../bnfs/uniview.js";

import * as path from "path";
import * as fs from "fs";


const    cwd = path.dirname(process.argv[1]);
let     data = fs.readFileSync(path.join(cwd, './sample.uv'), 'utf8');
const result = bnf.Parse_Program(data, true);

if (result instanceof Shared.ParseError) {
	console.error(syntax.toString());
	process.exit(1);
}

if (result.isPartial) {
	console.log(result.root);

	fs.writeFileSync('./dump.json', JSON.stringify(result, null, 2));

	console.error(`Partial parse`);
	console.error(`Unexpected syntax at ${result.root.end.toString()}`);
	process.exit(1);
}

console.log("Finished");