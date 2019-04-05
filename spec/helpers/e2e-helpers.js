const getTestSelector = (testIds = null) =>
    testIds == null ? [] : testIds.split(' ')
        .map((testId) => `[data-test-id="${testId}"]`)
        .join(' ');

function el(testIds = null, byLocator = null, parent = null) {
    var locator;

    if (parent != null) {
        locator = parent.element(by.css(getTestSelector(testIds)));
    } else {
        locator = element(by.css(getTestSelector(testIds)));
    }

    return byLocator == null ? locator : locator.element(byLocator);
}

function els(testIds = null, byLocator = null, parent = null) {
    var locator;

    if (parent != null) {
        locator = parent.all(by.css(getTestSelector(testIds)));
    } else {
        locator = element.all(by.css(getTestSelector(testIds)));
    }

    return byLocator == null ? locator : locator.all(byLocator);
}

module.exports = {
    el: el,
    els: els,
    s: getTestSelector,
};