import {browser} from 'protractor';
import {el, els, ECE, hover} from 'end-to-end-testing-helpers';
import {nav} from './helpers/utils';

describe('vocabularies', () => {
    beforeEach(() => {
        nav('/settings/vocabularies');
    });

    it('can restore vocabulary data when editing is cancelled', () => {
        const initialTitle = 'Categories';
        const toAdd = 'test';
        const vocabularyItem = els(['vocabulary-item']).get(0);

        browser.wait(ECE.textToBePresentInElement(vocabularyItem, initialTitle));

        hover(vocabularyItem);

        el(['vocabulary-item--start-editing']).click();
        el(['vocabulary-edit-field--name']).sendKeys(toAdd);
        browser.wait(ECE.textToBePresentInElement(vocabularyItem, initialTitle + toAdd));

        el(['vocabulary-edit-modal--cancel']).click();
        browser.wait(ECE.textToBePresentInElement(vocabularyItem, initialTitle));
    });
});
