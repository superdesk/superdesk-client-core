function getHiddenElementHeight(el: HTMLElement) {
    el.style.setProperty('display', 'block');

    const height = el.offsetHeight;

    el.style.setProperty('display', 'none');

    return height;
}

/**
 * Toggles visibility of an element and animates height in the process.
 */
export function slideUpDown(el: HTMLElement, onAnimationFinish?: () => void) {
    const hiddenBeforeAnimation = el.style.display === 'none';

    let fromHeight;
    let toHeight;

    if (el.style.display === 'none') {
        fromHeight = '0px';
        toHeight = `${getHiddenElementHeight(el)}px`;

        el.style.setProperty('display', 'block');
        el.style.setProperty('height', fromHeight);
    } else {
        fromHeight = `${el.offsetHeight}px`;
        toHeight = '0px';
    }

    el.style.setProperty('overflow', 'hidden');

    const animation = el.animate({height: [`${el.offsetHeight}px`, toHeight]}, 150);

    animation.onfinish = () => {
        el.style.setProperty('display', hiddenBeforeAnimation ? '' : 'none');
        el.style.setProperty('height', '');
        el.style.setProperty('overflow', '');

        onAnimationFinish?.();
    };

    el.style.setProperty('height', toHeight);
}
