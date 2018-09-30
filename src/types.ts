import isISODate = require('is-iso-date');
export type int  = number;
export type char = string;
export interface BasicObject<TValue = unknown> {
    [key: string]: TValue;
}
export interface BasicFunctor<
    TArgs extends any[]  = unknown[],
    TRetval              = unknown,
    TProps               = unknown
    > extends BasicObject<TProps> {
    (...args: TArgs): TRetval;
}
export type BasicType = number    | string      | boolean  |
                        undefined | BasicObject | BasicFunctor  | symbol;
export type BasicTypeName = 'number'    | 'string' | 'boolean'  |
                            'undefined' | 'object' | 'function' | 'symbol';

export function isBasicObject(suspect: unknown) : suspect is BasicObject<unknown> {
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
export type TypePredicate = (suspect: unknown) => boolean;
export type TypeDescription = TypeDescrObjMap | TypeDescrArray | TypePredicate |
                                 TypeDescrSet | BasicTypeName;

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
 *                  Else if it is a TypePredicate, then returns typeDescr(suspect).
 *
 *                  Else returns false.
 */
export function conforms<T = unknown>(suspect: unknown, typeDescr: TypeDescription)
    : suspect is T {
    //
    if (typeof typeDescr === 'string') {
        return typeof suspect === typeDescr;
    }
    if (typeof typeDescr === 'function'){
        return (typeDescr as TypePredicate)(suspect);
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
        return typeDescr.every((itemDescr, i) => conforms(suspect[i], itemDescr));
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



export namespace TypeChecks {
    export function isInteger(suspect: unknown): suspect is number {
        return typeof suspect === 'number' && Number.isInteger(suspect);
    }
    export function isPositiveInteger(suspect: unknown): suspect is number {
        return isInteger(suspect) && suspect > 0;
    }
    export function isPositiveNumber(suspect: unknown): suspect is number {
        return typeof suspect === 'number' && suspect > 0;
    }
    export function isZeroOrPositiveInteger(suspect: unknown): suspect is number {
        return isPositiveInteger(suspect) || suspect === 0;
    }
    export function isZeroOrPositiveNumber(suspect: unknown): suspect is number {
        return isPositiveNumber(suspect) || suspect === 0;
    }
    export function isOneOf<T>(possibleValues: T[]){
        return (suspect: any): suspect is T => possibleValues.includes(suspect);
    }
    export function isIsoDateString(suspect: unknown): suspect is string {
        return typeof suspect === 'string' && isISODate(suspect);
    }
}
