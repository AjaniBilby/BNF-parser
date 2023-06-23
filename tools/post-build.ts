import * as path from "path";
import * as fs from "fs";

let bnf_json = fs.readFileSync(path.join(__dirname, '../bnf.json'), 'utf8');

const preload =
'"use strict";' +
'Object.defineProperty(exports, "__esModule", { value: true });' +
`exports.bnf_json=${bnf_json};`;

fs.writeFileSync(
	path.join(__dirname, '../bin/preload.js'),
	preload
);