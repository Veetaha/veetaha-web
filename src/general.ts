import { BasicObject } from './types';

export function deepCopy<T>(obj: T) : T {
    if (typeof obj === 'object' && obj){
        const copy: T = Object.create(Object.getPrototypeOf(obj));
        for (const key of Object.getOwnPropertyNames(obj)) {
            (copy as BasicObject)[key] = deepCopy((obj as BasicObject)[key]);
        }
        return copy;
    }
    return obj;
}