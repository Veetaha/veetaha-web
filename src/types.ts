export type int  = number;
export type char = string;
export interface BasicObject<TValue = unknown> {
    [key: string]: TValue;
}
export interface BasicFunctor<
    TArgs extends any[]  = unknown[],
    TRetval              = unknown,
    T                    = unknown
    > extends BasicObject<T> {
    (...args: TArgs): TRetval;
}
export type BasicType = number    | string      | boolean  |
                        undefined | BasicObject | BasicFunctor  | symbol;
export type BasicTypeName = 'number'    | 'string' | 'boolean'  |
                            'undefined' | 'object' | 'function' | 'symbol';

export function isBasicObject<T = unknown>(suspect: unknown) : suspect is BasicObject<T> {
    return Boolean(
        suspect && (typeof suspect === 'object' || typeof suspect === 'function')
    );
}


export function isBasicTypeName(suspect: string): suspect is BasicTypeName {
    switch (suspect) {
        case 'number':    case 'string': case 'boolean':
        case 'undefined': case 'object': case 'function':
        case 'symbol': return true;
        default:       return false;
    }
}
export interface TypeDescrObjMap extends BasicObject<TypeDescription>
{}
export interface TypeDescrArray  extends Array<TypeDescription>
{}
export interface TypeDescrSet    extends Set<TypeDescription>
{}

export type TypeDescription = TypeDescrObjMap | TypeDescrArray | TypeDescrSet | BasicTypeName;

/**
 * Determines whether the specified suspect type satisfies the restriction of the given type
 * description (TD).
 * @type  T         Typescript type suspect is treated as, if this function returns true.
 * @param suspect   Entity of unknown type to be tested for conformance according to TD.
 * @param typeDescr If it is a basic JavaScript typename string (should satisfy typeof operator
 *                  domain definition), then function returns "typeof suspect === typeDescr".
 *
 *                  Else if it is a Set<TD>, returns true if suspect conforms to at
 *                  least one of the given TDs in Set.
 *
 *                  Else if it is an Array<TD> and it consists of one item,
 *                  returns true if suspect is Array and each of its items conforms to the given
 *                  TD at typeDescr[0].
 *
 *                  Else if it is an Array<TD> and it consists of more than one item,
 *                  returns true if suspect is Array and suspect.length === typeDescr.length
 *                  and each suspect[i] conforms to typeDescr[i] type description.
 *
 *                  Else if it is an empty Array, throws Error.
 *
 *                  Else if it is an object, returns true if suspect is an object and
 *                  each typeDescr[key] is a TD for suspect[key]. (Excess properties in suspect
 *                  do not matter).
 *
 *                  Else returns false.
 */
export function conforms<T = unknown>(suspect: unknown, typeDescr: TypeDescription)
    : suspect is T {
    //
    if (typeof typeDescr === 'string'){
        return typeof suspect === typeDescr;
    }
    if (Array.isArray(typeDescr)) {
        if (!Array.isArray(suspect)) {
            return false;
        }
        if (!typeDescr.length){
            throw new Error('type description array requires at least one item');
        }
        if (typeDescr.length === 1) {
            return suspect.every((item: unknown) => conforms(item, typeDescr[0]));
        }
        if (typeDescr.length !== suspect.length){
            return false;
        }
        for (let i = 0; i < suspect.length; ++i){
            if (!conforms(suspect[i], typeDescr[i])){
                return false;
            }
        }
        return true;
    }
    if (typeDescr instanceof Set){
        for (const possibleTypeDescr of typeDescr){
            if (conforms(suspect, possibleTypeDescr)) {
                return true;
            }
        }
        return false;
    }
    if (!isBasicObject(suspect) || Array.isArray(suspect)) {
        return false;
    }
    for (const propName of Object.getOwnPropertyNames(typeDescr)){
        if (!conforms(suspect[propName], typeDescr[propName])) {
            return false;
        }
    }
    return true;
}


export interface Callback<TErr, TData0 extends any[]> {
    (err: null, ...data: TData0): void;
    (err: TErr, data: null): void;
}
export interface Identifiable {
    id: number;
}


