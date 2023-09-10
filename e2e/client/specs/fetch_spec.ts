import {element, browser, protractor, by, $} from 'protractor';

import {workspace} from './helpers/workspace';
import {content} from './helpers/content';
import {authoring} from './helpers/authoring';
import {desks} from './helpers/desks';
import {multiAction} from './helpers/actions';
import {ECE, el, els} from '@superdesk/end-to-end-testing-helpers';

describe('fetch', () => {
    beforeEach(() => {
        workspace.open();
        workspace.switchToDesk('SPORTS DESK');
        content.setListView();
    });

    it('can fetch from ingest with menu', () => {
        workspace.openIngest();
        content.actionOnItem('Fetch', 0);
        workspace.openContent();
        expect(content.count()).toBe(3);
    });

    it('can fetch from content with menu', () => {
        workspace.openIngest();
        content.actionOnItem('Fetch', 0);
        workspace.openContent();
        expect(content.count()).toBe(3);
    });

    it('can fetch as', () => {
        workspace.openIngest();
        content.actionOnItem('Fetch To', 0);
        el(['interactive-actions-panel', 'fetch']).click();
        workspace.openContent();
        expect(content.count()).toBe(3);
    });

    it('can remove ingest item', () => {
        workspace.openIngest();
        content.actionOnItem('Remove', 0);
        browser.wait(ECE.hasElementCount(els(['article-item']), 0));
    });

    it('can not Fetch-and-Open if selected desk as a non-member', () => {
        workspace.openIngest();
        content.actionOnItem('Fetch To', 0);

        var btnFetchAndOpen = element(by.css('[ng-disabled="disableFetchAndOpenButton()"]'));

        expect(btnFetchAndOpen.getAttribute('disabled')).toBeFalsy();

        // Adding a new desk with no member, which serves as a non-member desk when selected
        desks.openDesksSettings();
        desks.getNewDeskButton().click();
        desks.deskNameElement().sendKeys('Test Desk');
        desks.deskDescriptionElement().sendKeys('Test Description');
        desks.deskSourceElement().sendKeys('Test Source');
        desks.setDeskType('authoring');
        desks.setDeskDefaultContentTemplate('testing');
        desks.setDeskDefaultContentProfile('testing');
        desks.actionDoneOnGeneralTab();

        workspace.openIngest();
        content.actionOnItem('Fetch To', 0);
        authoring.selectDeskforSendTo('Test Desk');
        expect(btnFetchAndOpen.getAttribute('disabled')).toBeTruthy();
    });

    it('can hide stage with global read OFF if selected desk as a non-member', () => {
        workspace.openIngest();
        content.actionOnItem('Fetch To', 0);

        var btnFetchAndOpen = element(by.css('[ng-disabled="disableFetchAndOpenButton()"]'));

        expect(btnFetchAndOpen.getAttribute('disabled')).toBeFalsy();

        // Adding a new desk with no member, which serves as a non-member desk when selected
        desks.openDesksSettings();
        desks.getNewDeskButton().click();
        desks.deskNameElement().sendKeys('Test Desk');
        desks.deskDescriptionElement().sendKeys('Test Description');
        desks.deskSourceElement().sendKeys('Test Source');
        desks.setDeskType('authoring');
        desks.setDeskDefaultContentTemplate('testing');
        desks.setDeskDefaultContentProfile('testing');
        desks.actionSaveAndContinueOnGeneralTab(); // save desk and continue to Stages tab

        // Consider one stage with Global Read OFF and another stage with Global Read ON status.
        // create new stage with Global Read OFF
        desks.getNewStageButton().click();
        desks.stageNameElement().sendKeys('Test Stage');
        desks.stageDescriptionElement().sendKeys('Test Stage Description');
        expect(desks.getGlobalReadFlag().getAttribute('checked')).toBeTruthy();
        desks.toggleGlobalReadFlag(); // turn OFF Global Read
        expect(desks.getGlobalReadFlag().getAttribute('checked')).toBeFalsy();
        desks.saveNewStage();
        // consider existing stage with Global Read ON
        desks.editStage('Working Stage');
        expect(desks.getGlobalReadFlag().getAttribute('checked')).toBeTruthy();
        desks.cancelEditStage();
        desks.actionDoneOnStagesTab();

        // Now test expections for stages of Test Desk as selected desk, in Fetch To panel at workspace.
        workspace.openIngest();
        content.actionOnItem('Fetch To', 0);
        authoring.selectDeskforSendTo('Test Desk');

        var sidebar = element.all(by.css('.side-panel')).last();

        expect(sidebar.element(by.buttonText('Working Stage')).isPresent()).toBeTruthy();
        expect(sidebar.element(by.buttonText('Test Stage')).isPresent()).toBeFalsy();
        expect(btnFetchAndOpen.getAttribute('disabled')).toBeTruthy();
    });

    it('can fetch multiple items', () => {
        workspace.openIngest();
        content.selectItem(0);
        browser.sleep(1000); // Wait for animation
        multiAction('Fetch');
        workspace.openContent();
        expect(content.count()).toBe(3);
    });

    it('can fetch as multiple items', () => {
        workspace.openIngest();
        content.selectItem(0);
        browser.sleep(1000); // Wait for animation
        multiAction('Fetch to');
        content.send();
        workspace.openContent();
        expect(content.count()).toBe(3);
    });

    it('can remove multiple ingest items', () => {
        workspace.openIngest();
        browser.wait(ECE.hasElementCount(els(['article-item']), 1));

        content.selectItem(0);
        browser.sleep(1000); // Wait for animation

        multiAction('Remove');

        browser.wait(ECE.hasElementCount(els(['article-item']), 0));
    });
});
