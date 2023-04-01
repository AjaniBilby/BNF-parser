export class PromiseQueue {
	private _queue: Array<() => void>;

	constructor() {
		this._queue = [];
	}

	/**
	 * Hangs until trigger is called
	 */
	wait(): Promise<void> {
		return new Promise((res)=> {
			this._queue.push(res);
		});
	}

	/**
	 * Allows all hanging waits to return
	 */
	trigger() {
		// Use a batch as these triggers might lead to more waits
		let batch = this._queue;
		this._queue = [];

		for (let func of batch) {
			func();
		}
	}
}