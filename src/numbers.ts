/**
 * Returns true if suspect is inside of the closed range [min, max]
 * @param suspect Value to test for being in the close range [min, max].
 * @param min Lower range bound.
 * @param max Higher range bound.
 *      If min < max, then checks that suspect is inside of the range
 *      (-Infinity, max] && [min, +Infinity)
 *
 */
export function isWithinRange(suspect: number, min: number, max: number) {
    return min <= suspect && suspect <= max;
}
export const MaxInt32 =  (2 ** 31) - 1;
export const MinInt32 = -(2 ** 31);

/**
 * Checks that suspect number is an integer and its value can be stored in a signed 32 bit integer.
 * @param suspect Value to test.
 */
export function isWithinInt32(suspect: number) {
    return Number.isInteger(suspect) && MinInt32 <= suspect && suspect <= MaxInt32;
}

