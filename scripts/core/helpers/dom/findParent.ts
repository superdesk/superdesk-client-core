export function findParent(
    element: HTMLElement,
    checkFn: (element: HTMLElement) => boolean,
    checkCurrentElement: boolean,
): HTMLElement | null {
    var elementToCheck = checkCurrentElement === true ? element : element.parentElement;

    while (elementToCheck != null && checkFn(elementToCheck) !== true) {
        elementToCheck = elementToCheck.parentElement;
    }

    return elementToCheck;
}
