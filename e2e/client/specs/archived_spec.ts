import {nav} from './helpers/utils';
import {globalSearch} from './helpers/search';
import {authoring} from './helpers/authoring';
import {content} from './helpers/content';
import {monitoring} from './helpers/monitoring';
import {element, by} from 'protractor';

describe('archived', () => {
    beforeEach(() => {
        nav('/search').then(globalSearch.setListView());
    });

    it('display items and open an item preview', () => {
        globalSearch.waitForItemCount(16);
        globalSearch.getArchivedContent();
        globalSearch.waitForItemCount(3);
        var itemText = globalSearch.getTextItem(0);

        globalSearch.itemClick(0);
        expect(monitoring.getPreviewTitle()).toBe(itemText);
    });

    it('open an item in authoring', () => {
        globalSearch.waitForItemCount(16);
        globalSearch.getArchivedContent();
        globalSearch.waitForItemCount(3);
        globalSearch.actionOnItem('Open', 0);
        expect(content.getWidgets().count()).toBe(1);
        expect(authoring.close_button.isDisplayed()).toBe(true);
        expect(authoring.save_button.isPresent()).toBe(false);
        expect(authoring.edit_button.isDisplayed()).toBe(false);
        expect(authoring.edit_correct_button.isDisplayed()).toBe(false);
        expect(authoring.edit_kill_button.isDisplayed()).toBe(false);
        expect(authoring.edit_takedown_button.isDisplayed()).toBe(false);
        expect(element(by.css('[data-test-id="authoring-create]')).isPresent()).toBe(false);
        expect(authoring.sendToButton.isDisplayed()).toBe(false);
        authoring.showInfo();
        expect(authoring.isPublishedState()).toBe(true);
    });
});
