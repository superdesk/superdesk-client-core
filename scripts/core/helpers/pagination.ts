const REST_API_LIMIT = 200;

function getPageSize(from, to): number {
    const minPageSize = to - from;

    for (let testPageSize = minPageSize; testPageSize <= REST_API_LIMIT; testPageSize++) {
        const remainder = from % testPageSize;
        const testFrom = from - remainder;
        const testTo = testFrom + testPageSize;

        const inRange = testFrom <= from && testTo >= to;

        if (inRange) {
            return testPageSize;
        }
    }
}

/**
 * Given from/to indexes of items to fetch,
 * computes page size and index
 * for fetching the items using pagination API
 */
export function getPaginationInfo(
    from: number,
    to: number,
): {pageSize: number, nextPage: number} {
    const pageSize = getPageSize(from, to);
    const remainder = from % pageSize;
    const fromPage = (from - remainder) / pageSize;

    return {
        pageSize: pageSize,
        nextPage: fromPage + 1,
    };
}
