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
