/**
 * @param {Array<string>} testIds
 */
const getTestSelector = (testIds = null) =>
    testIds == null ? [] : testIds
        .map((testId) => `[data-test-id="${testId}"]`)
        .join(' ');

/**
 * @param {Array<string>} testIds
 */
function el(
    testIds = null,
    byLocator = null, // example: by.cssContainingText('option', 'Text')
    parent = null
) {
    var locator;

    if (parent != null) {
        locator = parent.element(by.css(getTestSelector(testIds)));
    } else {
        locator = element(by.css(getTestSelector(testIds)));
    }

    return byLocator == null ? locator : locator.element(byLocator);
}


/**
 * @param {Array<string>} testIds
 */
function els(
    testIds = null,
    byLocator = null, // example: by.cssContainingText('option', 'Text')
    parent = null
) {
    var locator;

    if (parent != null) {
        locator = parent.all(by.css(getTestSelector(testIds)));
    } else {
        locator = element.all(by.css(getTestSelector(testIds)));
    }

    return byLocator == null ? locator : locator.all(byLocator);
}

function hasElementCount(locator, expectedElementCount) {
    return () => locator.count().then((count) => count === expectedElementCount);
}

module.exports = {
    el: el,
    els: els,
    s: getTestSelector,
    hasElementCount: hasElementCount,
};