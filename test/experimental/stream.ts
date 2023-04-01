import { Parser, ParseError, experimental } from 'bnf-parser';
import * as fs from 'fs';



let fstream = fs.createReadStream(
	"P:\\Documents\\school\\UTS\\Course\\Social and Information Network\\simplewiki-latest-pages-articles.xml", "utf8"
);

let stream = new experimental.StreamCache();
stream.pipe_node(fstream);

async function main() {
	let cursorA = stream.cursor();
	console.log(22, await cursorA.readAtleast(5));
	let cursorB = cursorA.clone();
	console.log(24, await cursorA.readAtleast(10));
	console.log(25, await cursorA.readAtleast(5));
	console.log(26, await cursorB.readAtleast(5));
	console.log("drop B");
	stream.drop(cursorB);
	stream.shrink();
	stream.drop(cursorA);
}

main();

fstream.on('end', ()=>{
	clearInterval(status);
})


let status = setInterval(()=>{
	const memoryUsage = process.memoryUsage();
	const gbUsed = memoryUsage.heapUsed / 1024 / 1024 / 1024;
	console.log(`Memory usage: ${gbUsed.toFixed(2)} GB`);
}, 500)
