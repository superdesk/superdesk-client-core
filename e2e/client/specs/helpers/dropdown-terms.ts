import {element, by} from 'protractor';

export function selectFromMetaTermsDropdown(fieldId: string, valuesToSelect: Array<string>) {
    const dropdown = element(by.css(`[data-field="${fieldId}"]`));

    dropdown.element(by.css('.dropdown__toggle')).click();

    for (const val of valuesToSelect) {
        dropdown.element(by.css('.main-list')).element(by.buttonText(val)).click();
    }
}
