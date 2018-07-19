export function querySelectorParent(element, selector) {
    var currentParent = element.parentElement;

    while (currentParent != null && currentParent.matches(selector) === false) {
        currentParent = currentParent.parentElement;
    }

    return currentParent;
}

export function isElementInViewport(element) {
    var rect = element.getBoundingClientRect();

    return rect.top >= 0
        && rect.left >= 0
        && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
        && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
}