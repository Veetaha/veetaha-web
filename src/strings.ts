
export function containsSlashes(suspect: string) {
    for (let char of suspect) {
        if (char === '\\' || char === '/'){
            return true;
        }
    }
    return false;
}
