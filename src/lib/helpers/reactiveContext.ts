import { writable, type Writable } from 'svelte/store';

import { objectEntries } from './object';
import { uniqueContext } from './uniqueContext';

type ValueSetterPair<T> = [T, (v: T) => void];

type ValueSetterPairs<T> = {
	[K in keyof T]: ValueSetterPair<T[K]>;
};

type Values<T> = {
	[K in keyof T]: T[K];
};

type GetContextReturn<T extends Record<string, unknown>> = Writable<Values<T>>;

export function reactiveContext<T extends Record<string, unknown>>() {
	const initialContext = uniqueContext<GetContextReturn<T>>();

	const setContext = (values: ValueSetterPairs<T>) => {
		const store = writable(
			objectEntries(values).reduce((acc, [key, value]) => {
				acc[key] = value[0];
				return acc;
			}, {} as Values<T>)
		);

		const set = (v: Values<T>) => {
			store.set(v);
			objectEntries(v).forEach(([key, value]) => {
				const setter = values[key][1];
				setter(value);
			});
		};

		const update = (updater: (state: Values<T>) => Values<T>) => {
			store.update((v) => {
				const newState = updater(v);
				objectEntries(newState).forEach(([key, value]) => {
					const setter = values[key][1];
					setter(value);
				});
				return newState;
			});
		};

		const contextStore = {
			...store,
			set,
			update
		};

		initialContext.setContext(contextStore);

		return contextStore;
	};

	return { ...initialContext, setContext };
}