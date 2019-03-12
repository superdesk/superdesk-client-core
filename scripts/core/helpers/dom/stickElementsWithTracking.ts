import {stickElements} from './stickElements';
import {OnEveryAnimationFrame} from './onEveryAnimationFrame';

export class StickElementsWithTracking {
    animationManager: OnEveryAnimationFrame;

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
