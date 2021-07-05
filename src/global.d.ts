/// <reference types="@sveltejs/kit" />
type IAnyFunction = (...args: unknown[]) => unknown

type IHash<T> = Record<string, T>
