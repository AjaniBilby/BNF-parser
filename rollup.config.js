import * as fs from "fs";

const bnf = fs.readFileSync('./bnf/bnf.bnf', 'utf8');
fs.writeFileSync("./docs/source/syntax/bnf.bnf", bnf);

const resolveToUnpkg = {
	resolveId(source) {
		if (source === 'binaryen') {
			return {id: 'https://unpkg.com/binaryen@113.0.0/index.js', external: true};
		}
		return null;
	}
}

export default [
{
	input: './bin/index.js',
	output: {
		file: './docs/source/static/dist/bnf-parser.js',
		format: 'es',
		name: 'bnf_parser'
	},
	plugins: [resolveToUnpkg]
}];