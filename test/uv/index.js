import * as Shared from "../bnfs/shared.js";
import * as bnf from "../bnfs/uniview.js";


const    cwd = path.dirname(process.argv[1]);
let     data = fs.readFileSync(path.join(cwd, './sample.uv'), 'utf8');
const syntax = bnf.program(data);

if (syntax instanceof Shared.ParseError) {
	console.error(syntax.toString());
	process.exit(1);
}

if (syntax.isPartial) {
	console.error(`Partial parse`);
	console.error(`Unexpected syntax at ${syntax.reachBytes}`);
	process.exit(1);
}

console.log("Finished");