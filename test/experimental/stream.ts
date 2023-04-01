import { experimental } from 'bnf-parser';
import * as fs from 'fs';

let fstream = fs.createReadStream(
	"P:\\Documents\\school\\UTS\\Course\\Social and Information Network\\simplewiki-latest-pages-articles.xml",
	"utf8"
);

let peaked = 0;
let read = 0;

let max_buf = 0;
let max_pool = 0;

let stream = new experimental.StreamCache();
let cursorA = stream.cursor();
stream.pipe_node(fstream);

async function main() {
	console.time("duration");

	while (!cursorA.isDone()) {
		let val = cursorA._skip_read(100);
		if (cursorA.isDone()) {
			break;
		}
		read += val.length;
		peaked += val.length;

		if (val == "") {
			let val = await cursorA.next(100);
			read += val.length;
		}
	}

	cursorA.drop();
}
main();

fstream.on('end', ()=>{
	console.timeEnd("duration");
	console.log(`read: ${read}, peaked: ${peaked}`);
});