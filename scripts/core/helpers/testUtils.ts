const getTestSelector = (...testIds: Array<string>) => {
    const selector = testIds
        .map((testId) => {
            if (testId.includes('=')) {
                const [id, value] = testId.split('=');

                return `[data-test-id="${id}"][data-test-value="${value}"]`;
            } else {
                return `[data-test-id="${testId}"]`;
            }
        })
        .join(' ');

    return selector;
};

export const s = getTestSelector;
