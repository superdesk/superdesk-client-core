import {findParent} from './findParent';

export const querySelectorParent = (element, selector) => findParent(element, (el) => el.matches(selector), false);
