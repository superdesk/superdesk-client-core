import {element, by} from 'protractor';

import {workspace} from './helpers/workspace';
import {content} from './helpers/content';
import {authoring} from './helpers/authoring';
import {legalArchive} from './helpers/legal_archive';
import {hover} from './helpers/utils';

describe('legal_archive', () => {
    it('can display Legal Archive option in hamburger menu', () => {
        workspace.open();

        expect(legalArchive.getLegalArchiveMenuOption().isDisplayed()).toBe(true);
    });

    it('can display items in Legal Archive', () => {
        legalArchive.open();
        expect(content.getItems().count()).toBe(4);
    });

    it('can display only OPEN option in the Actions Menu for items in Legal Archive', () => {
        legalArchive.open();
        var menu = content.openItemMenu('item1 in legal archive');
        var menuItems = menu.all(by.repeater('activity in group.actions'));

        expect(menuItems.count()).toBe(2); // open + open in new window
    });

    it('on open item close preview in a Legal Archive', () => {
        legalArchive.open();

        content.previewItem('item1 in legal archive');
        expect(element(by.id('item-preview')).isDisplayed()).toBe(true);

        content.actionOnItem('Open', 'item1 in legal archive');
        expect(element(by.id('item-preview')).isDisplayed()).toBe(false);
    });

    it('can open text item in a Legal Archive', () => {
        legalArchive.open();

        content.actionOnItem('Open', 'item1 in legal archive');

        expect(content.getItemType('text').isDisplayed()).toBe(true);
        expect(content.getWidgets().count()).toBe(2);
        assertAuthoringTopbarAndItemState();
    });

    it('can open package in a Legal Archive', () => {
        legalArchive.open();

        content.actionOnItem('Open', 'package1 in legal archive');

        expect(content.getItemType('composite')
            .waitReady()
            .then((elem) => elem.isDisplayed()),
        ).toBe(true);
        expect(content.getWidgets().count()).toBe(2);
        assertAuthoringTopbarAndItemState();
    });

    xit('can open items in the package', () => {
        legalArchive.open();

        content.actionOnItem('Open', 'package1 in legal archive');

        element.all(by.repeater('child in item.childData')).then((itemsInPackage) => {
            hover(itemsInPackage[0]);
            itemsInPackage[0].element(by.className('package-item__open-item')).click();
            assertAuthoringTopbarAndItemState();
        });
    });

    it('can show version and item history for an item', () => {
        legalArchive.open();
        content.actionOnItem('Open', 'item2 in legal archive');

        authoring.showVersions();
        expect(authoring.getVersions().count()).toBe(3);
        authoring.showVersions();

        authoring.showHistory();
        expect(authoring.getHistoryItems().count()).toBe(3);
    });

    function assertAuthoringTopbarAndItemState() {
        expect(authoring.close_button.isDisplayed()).toBe(true);
        expect(authoring.save_button.isPresent()).toBe(false);
        expect(authoring.edit_button.isPresent()).toBe(false);
        expect(authoring.edit_correct_button.isPresent()).toBe(false);
        expect(authoring.edit_kill_button.isPresent()).toBe(false);
        expect(authoring.navbarMenuBtn.isPresent()).toBe(false);
        expect(authoring.sendToButton.isDisplayed()).toBe(false);

        authoring.showInfo();
        expect(authoring.isPublishedState()).toBe(true);
    }
});
