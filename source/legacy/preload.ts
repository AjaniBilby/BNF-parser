/**==============================================
 * THIS FILE GETS OVER WRITTEN AT COMPILE TIME
 *===============================================

 * This file get's over written by /tools/post-build during build
 * When using a compiled version all preloaded assets should already be a part of this file
 * They are only loaded dynamically for development
 *
 */

import * as fs from "fs";

export const bnf_json = JSON.parse(fs.readFileSync(
	'./bnf.json',
	'utf8'
));