export function compareTime(
    str1: string,
    str2: string,
): number {
    const num1 = parseInt(str1.replace(':', ''), 10);
    const num2 = parseInt(str2.replace(':', ''), 10);

    if (num1 < num2) {
        return -1;
    } else if (num1 === num2) {
        return 0;
    } else {
        return 1;
    }
}

export function getTimeNumber(
    time: string, // ISO time e.g. 23:59
) {
    return parseInt(time.replace(':', ''), 10);
}

export function getLowest(items: Array<number>): number | null {
    return items.sort((a, b) => {
        if (a < b) return -1;
        if (a > b) return 1;

        return 0;
    })[0] ?? null;
}

export function getLowestThrows(items: Array<number>): number {
    if (items.length < 1) {
        throw new Error();
    }

    return items.sort((a, b) => {
        if (a < b) return -1;
        if (a > b) return 1;

        return 0;
    })[0];
}

/**
 * returns `null` if array is empty
 */

export function findEarliestTime(
    times: Array<string>, // ISO time e.g. 23:59
): string | null {
    if (times.length < 0) {
        throw new Error();
    }

    return times
        .map((time) => ({
            str: time,
            num: parseInt(time.replace(':', ''), 10),
        }))
        .sort((a, b) => {
            if (a.num < b.num) {
                return -1;
            } else if (a.num === b.num) {
                return 0;
            } else {
                return 1;
            }
        })[0].str;
}
