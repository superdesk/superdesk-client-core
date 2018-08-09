export function findParent(element, checkFn, checkCurrentElement) {
    var elementToCheck = checkCurrentElement === true ? element : element.parentElement;

    while (elementToCheck != null && checkFn(element) !== true) {
        elementToCheck = elementToCheck.parentElement;
    }

    return elementToCheck;
}