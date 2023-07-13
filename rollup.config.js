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