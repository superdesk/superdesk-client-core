export function stickElements(target, source, preferredPosition) {
    const targetRect = target.getBoundingClientRect();

    source.style.position = 'absolute';

    const {clientWidth, clientHeight} = document.body;

    // position horizontally

    const placeOnTheLeft = () => {
        source.style.right = '';
        source.style.left = targetRect.left + 'px';
    };

    const placeOnTheRight = () => {
        source.style.left = '';
        source.style.right = (clientWidth - targetRect.right) + 'px';
    };

    const enoughSpaceOnTheLeft = clientWidth > targetRect.left + source.offsetWidth;

    if (preferredPosition.x === 'left') {
        placeOnTheLeft();
    } else if (preferredPosition.x === 'right') {
        placeOnTheRight();
    } else if (enoughSpaceOnTheLeft) {
        placeOnTheLeft();
    } else {
        placeOnTheRight();
    }

    // position vertically

    const placeAtTheTop = () => {
        source.style.top = '';
        source.style.bottom = (clientHeight - targetRect.top) + 'px';
    };

    const placeAtTheBottom = () => {
        source.style.bottom = '';
        source.style.top = (targetRect.top + targetRect.height) + 'px';
    };

    const spaceBelowTarget = clientHeight - targetRect.bottom;
    const enoughSpaceAtTheBottom = spaceBelowTarget > source.offsetHeight;

    if (preferredPosition.y === 'bottom') {
        placeAtTheBottom();
    } else if (preferredPosition.y === 'top') {
        placeAtTheTop();
    } else if (enoughSpaceAtTheBottom) {
        placeAtTheBottom();
    } else {
        placeAtTheTop();
    }

    // return information about selected position
    // so it can be used in the next call
    return {
        x: source.style.left === '' ? 'right' : 'left',
        y: source.style.top === '' ? 'top' : 'bottom',
    };
}
