import * as fs from "fs";

let bnf_json = fs.readFileSync('./bnf.json', 'utf8');

const preload = `export const bnf_json=${bnf_json};`;

fs.writeFileSync(
	'./bin/legacy/preload.js',
	preload
);