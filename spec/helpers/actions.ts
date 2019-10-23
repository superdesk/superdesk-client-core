import {element} from 'protractor';
import {el, s} from 'end-to-end-testing-helpers';

export function multiAction(name: string) {
    const dropdown = element(s(['multi-actions-dropdown']));

    dropdown.isPresent().then((isPresent: boolean) => {
        if (isPresent) {
            el(['multi-actions-dropdown', 'dropdown-toggle']).click();
            el(['multi-actions-dropdown', name]).click();
        } else {
            el(['multi-actions-inline', name]).click();
        }
    });
}
