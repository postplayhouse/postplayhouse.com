export class ExMap<K, V> extends Map<K, V> {
	override get(key: K): V | undefined
	override get<T>(key: K, fallback: T): V | T
	override get(key: K, fallback?: unknown) {
		return super.get(key) ?? fallback
	}

	setNew(key: K, value: V): this {
		this.get(key) === undefined && this.set(key, value)
		return this
	}

	setOrGet(key: K, value: V): V {
		this.setNew(key, value)
		return this.get(key)!
	}

	update(key: K, updater: (current: V | undefined) => V): this
	update(key: K, defaultValue: V, updater: (current: V) => V): this
	update(
		key: K,
		arg2: V | ((current: V | undefined) => V),
		arg3?: (current: V) => V,
	): this {
		const updater = arg3 || (arg2 as (current: V | undefined) => V)
		const defaultValue = arg3 ? (arg2 as V) : (undefined as V)
		return this.set(key, updater(this.get(key, defaultValue)))
	}

	toEntriesArray(): [K, V][] {
		return Array.from(this.entries())
	}
}
