export interface ObjectAsMap<T = unknown> {
    [key: string] : T;
}

export function isObjectAsMap<T = unknown>(suspect: unknown) : suspect is ObjectAsMap<T> {
    return Boolean(
        suspect && (typeof suspect === 'object' || typeof suspect === 'function')
    );
}

export function deepCopy<T>(obj: T) : T {
    if (typeof obj === 'object' && obj){
        const copy: T = Object.create(Object.getPrototypeOf(obj));
        for (const key of Object.getOwnPropertyNames(obj)) {
            (copy as ObjectAsMap)[key] = deepCopy((obj as ObjectAsMap)[key]);
        }
        return copy;
    }
    return obj;
}