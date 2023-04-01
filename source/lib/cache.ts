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
	 * Will read n characters or the remaining amount before the end
	 */
	next(highWaterMark = 1): Promise<string> {
		return this._owner._read(this, highWaterMark);
	}

	_skip_read(highWaterMark = 1): string {
		return this._owner._skip_read(this, highWaterMark);
	}

	isDone(): boolean {
		return this._owner.isDone();
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

	private _cache: string[];
	private _total_cache: number;
	private _ended: boolean;

	shrinks: number;

	constructor() {
		this._ended = false;
		this._cursors = [];

		this._cache = [];
		this._total_cache = 0;

		this.shrinks = 0;

		this._signal = new PromiseQueue();
	}

	getCacheSize(): number {
		return this._total_cache;
	}
	getCachePools(): number {
		return this._cache.length;
	}

	isDone(): boolean {
		return this._ended;
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
			this.end("");
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

			this.end("");
		})();
	}

	/**
	 * Pipe single string to the stream cache
	 * @param stream
	 */
	write(str: string) {
		this._cache.push(str);
		this._total_cache += str.length;
		this._signal.trigger();
		this.shrink();
	}

	end (str: string) {
		this._ended = true;
		this.write(str);
	}

	/**
	 * Removes unreachable cached information
	 * @returns {void}
	 */
	shrink() {
		// Drop the currently buffered information
		//   as it is unreachable
		if (this._cursors.length === 0) {
			this._cache = [];
			this._total_cache = 0;
			this.shrinks++;
			return;
		}

		let extra = this._cache.length;
		for (let cursor of this._cursors) {
			let loc = this._offset_to_cacheLoc(cursor._offset);
			if (loc[0] < extra) {
				extra = loc[0];
			}
		}

		if (extra < 1) {
			return;
		}

		let size = 0;
		for (let i=0; i<extra; i++) {
			size += this._cache[i].length;
		}
		this._cache.splice(0, extra);

		for (let cursor of this._cursors) {
			cursor._offset -= size;
		}
		this._total_cache -= size;
		this.shrinks++;
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
	async _read(cursor: Cursor, size = 1): Promise<string> {
		if (cursor._offset < 0) {
			throw new Error("Cursor behind buffer position");
		}

		// Wait for more data to load if necessary
		while (cursor._offset > this._total_cache - size) {
			// The required data will never be loaded
			if (this._ended) {
				break;
			}

			// Wait for more data
			//   Warn: state might change here (including cursor)
			await this._signal.wait();
		}

		// Return the data
		let loc = this._offset_to_cacheLoc(cursor._offset);
		if (loc[0] >= this._cache.length) {
			return "";
		}

		let out = this._cache[loc[0]].slice(loc[1], loc[1]+size);
		cursor._offset += out.length;
		return out;
	}

	_skip_read(cursor: Cursor, size = 1): string {
		if (cursor._offset > this._total_cache - size) {
			return "";
		}

		// Return the data
		let loc = this._offset_to_cacheLoc(cursor._offset);
		if (loc[0] >= this._cache.length) {
			return "";
		}

		let out = this._cache[loc[0]].slice(loc[1], loc[1]+size);
		cursor._offset += out.length;
		return out;
	}


	private _offset_to_cacheLoc(offset: number) {
		let i = 0;
		for (; i<this._cache.length; i++) {
			if (offset < this._cache[i].length) {
				break;
			}

			offset -= this._cache[i].length;
		}

		return [i, offset];
	}
}