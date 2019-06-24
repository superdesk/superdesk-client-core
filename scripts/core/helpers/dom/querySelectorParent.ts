import {findParent} from './findParent';

export const querySelectorParent = (element: HTMLElement, selector: string) =>
    findParent(element, (el) => el.matches(selector), false);
