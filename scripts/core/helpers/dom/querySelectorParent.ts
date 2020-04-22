import {findParent} from './findParent';

export const querySelectorParent = (
    element: HTMLElement,
    selector: string,
    options?: {
        self: boolean; // will check the current element too if set to true
    },
) => {
    return findParent(
        element,
        (el) => el.matches(selector),
        options?.self ?? false,
    );
};
