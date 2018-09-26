export let enabled : boolean = true;

export function assert(truthy: any) {
    if (enabled && !truthy) {
        console.error(`Assertion failure: ${truthy}`);
        process.abort();
    }
}

export function assertNeverType(suspect: never) {
    if (!enabled) return;

    throw new Error(
        `Ahtung! Assertion for ${suspect} to be of type 'never' has fired.`
    );
}
export function unreachable(){
    if (!enabled) return;

    throw new Error(
        'Ahtung! Program workflow has reached an unreachable line of code.'
    );
}