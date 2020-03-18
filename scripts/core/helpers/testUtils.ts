const getTestSelector = (testIds: Array<string>) => {
    return testIds
        .map((testId) => `[data-test-id="${testId}"]`)
        .join(' ');
};

export const s = getTestSelector;
