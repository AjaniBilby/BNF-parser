import type * as Stream from 'stream';
import { PromiseQueue } from './promise-queue';




class Cursor {
	private _owner: StreamCache;
	_offset: number;

	constructor(owner: StreamCache, offset: number) {
		this._owner = owner;
		this._offset = offset;
		this._owner._subscribe(this);
	}

	/**
	 * Will read the next single character from the stream
	 */
	async next(): Promise<string | null> {
		let char = await this._owner._read(this);
		if (char) {
			this._offset += 1;
		}

		return char;
	}

	/**
	 * Will read at least n characters from the stream
	 * (could return empty string)
	 */
	async readAtleast(chars: number): Promise<string> {
		let out = "";
		while (out.length < chars) {
			let c = await this.next();
			if (c == null) {
				break;
			}

			out += c;
		}

		return out;
	}

	/**
	 * Will read n characters from the stream or return null if unable to
	 */
	async readChars(chars: number): Promise<string | null> {
		let out = await this.readAtleast(chars);
		if (out.length < chars) {
			return null;
		}

		return out;
	}

	/**
	 * Create another cursor at the same position
	 */
	clone(): Cursor {
		return new Cursor(this._owner, this._offset);
	}

	/**
	 * Remove this cursor from the stream
	 */
	drop() {
		this._owner.drop(this);
	}
};

/**
 * Takes a readable stream and allows cursors to move (forward only) over it
 * Reading data as it is read, but allowing cursor cloning to allow going back
 * and re-reading information as necessary, and also automatically dropping unreachable information
 */
export class StreamCache {
	private _signal: PromiseQueue;
	private _cursors: Cursor[];

	private _buffer: string;
	private _ended: boolean;

	constructor() {
		this._ended = false;
		this._buffer = "";
		this._cursors = [];

		this._signal = new PromiseQueue();
	}


	/**
	 * Pipe a NodeJS readable stream to the stream cache
	 * @param stream
	 */
	pipe_node(stream: Stream.Readable) {
		stream.on('data', (chunk)=> {
			this.write(chunk);
		});
		stream.on('end', ()=>{
			this._ended = true;
			this._signal.trigger();
			this.shrink();
		});
	}

	/**
	 * Pipe Web JS readable stream to the stream cache
	 * @param stream
	 */
	pipe_classic(stream: ReadableStream<string>) {
		(async ()=>{
			let reader = stream.getReader();

			while (true) {
				let res = await reader.read();
				if (res.value) {
					this.write(res.value);
				}

				if (res.done) {
					break;
				}
			}

			this._ended = true;
			this._signal.trigger();
			this.shrink();
		})();
	}

	/**
	 * Pipe single string to the stream cache
	 * @param stream
	 */
	write(str: string) {
		this._buffer += str;
		this._signal.trigger();
		this.shrink();
	}

	/**
	 * Removes unreachable cached information
	 * @returns {void}
	 */
	shrink() {
		// Drop the currently buffered information
		//   as it is unreachable
		if (this._cursors.length === 0) {
			this._buffer = "";
			return;
		}

		let extra = this._cursors
			.map(x => x._offset)
			.reduce((c, p) => Math.min(c, p), Infinity);

		if (extra < 1) {
			return;
		}

		this._buffer = this._buffer.slice(extra);
		// Adjust all of the cursor offsets
		for (let cursor of this._cursors) {
			cursor._offset -= extra;
		}
	}

	/**
	 * Creates a new cursor at the earliest available cache data
	 * @returns {Cursor}
	 */
	cursor() {
		return new Cursor(this, 0);
	}

	/**
	 * Removes a cursor from the stream process
	 * @param cursor
	 */
	drop(cursor: Cursor) {
		let i = this._cursors.indexOf(cursor);
		if (i == -1) {
			return;
		}

		this._cursors.splice(i, 1);
	}



	/**
	 * FOR INTERNAL USE ONLY
	 * @param cursor
	 */
	_subscribe(cursor: Cursor) {
		this._cursors.push(cursor);
	}


	/**
	 * INTERNAL USE ONLY
	 * This should not be called directly, instead call the read function on the cursor
	 * @param cursor must be created by this object
	 * @returns {Promise[string | null]}
	 */
	async _read(cursor: Cursor): Promise<string | null> {
		if (cursor._offset < 0) {
			throw new Error("Cursor behind buffer position");
		}

		// Wait for more data to load if necessary
		while (cursor._offset >= this._buffer.length) {
			// The required data will never be loaded
			if (this._ended) {
				return null;
			}

			// Wait for more data
			//   Warn: state might change here (including cursor)
			await this._signal.wait();
		}

		// Return the data
		if (cursor._offset < this._buffer.length) {
			return this._buffer[cursor._offset];
		}

		throw new Error("Something when horribly wrong - attempting to read out of bound stream data after stream ended");
	}
}