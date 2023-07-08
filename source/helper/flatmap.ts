

export function FlatMap<T, U>(arr: T[], lambda: (item: T) => U[]): U[] {
	const result: U[] = [];
	for (let item of arr) {
		result.push.apply(result, lambda(item));
	}
	return result;
}