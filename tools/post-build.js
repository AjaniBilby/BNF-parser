import * as fs from "fs";

let bnf_json = fs.readFileSync('./bnf.json', 'utf8');

const preload =
'"use strict";' +
'Object.defineProperty(exports, "__esModule", { value: true });' +
`exports.bnf_json=${bnf_json};`;

fs.writeFileSync(
	'./bin/preload.js',
	preload
);