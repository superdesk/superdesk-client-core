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

export class OnEveryAnimationFrame {
    // only use this with callbacks which are not resource intensive(<5ms)
    // don't forget to `destroy` when finished

    constructor(callback) {
        this.lastTimer = 0; // dummy value for initial check
        this.loop(callback);
    }
    loop(callback) {
        callback();
        if (this.lastTimer != null) {
            this.lastTimer = window.requestAnimationFrame(() => {
                this.loop(callback);
            });
        }
    }
    destroy() {
        window.cancelAnimationFrame(this.lastTimer);
        this.lastTimer = null;
    }
}

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

export class StickElementsWithTracking {
    constructor(target, source) {
        let preferredPosition = {};

        this.animationManager = new OnEveryAnimationFrame(() => {
            const selectedPosition = stickElements(target, source, preferredPosition);

            if (Object.keys(preferredPosition).length < 1) {
                preferredPosition = selectedPosition;
            }
        });
    }
    destroy() {
        this.animationManager.destroy();
    }
}