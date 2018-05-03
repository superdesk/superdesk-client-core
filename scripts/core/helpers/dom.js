export function querySelectorParent(element, selector) {
    var currentParent = element.parentElement;

    while (currentParent != null && currentParent.matches(selector) === false) {
        currentParent = currentParent.parentElement;
    }

    return currentParent;
}