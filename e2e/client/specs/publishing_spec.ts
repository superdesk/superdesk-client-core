import {publishQueue} from './helpers/publish_queue';

import {element, by, browser} from 'protractor';
import {
    assertToastMsg,
} from './helpers/utils';
import {monitoring, MONITORING_DEBOUNCE_MAX_WAIT} from './helpers/monitoring';
import {workspace} from './helpers/workspace';
import {authoring} from './helpers/authoring';
import {el, els, ECE} from '@superdesk/end-to-end-testing-helpers';
import {executeContextMenuAction} from '@superdesk/end-to-end-testing-helpers/dist/articlesList';

describe('publishing', () => {
    beforeEach(monitoring.openMonitoring);

    it('publish using HTTP Push delivery type and can preview content and search publish queue', () => {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.publish();

        publishQueue.openPublishQueue();
        expect(publishQueue.getHeadline(0).getText()).toMatch(/item5/);
        expect(publishQueue.getDestination(0).getText()).toMatch(/HTTP Push/);

        // can preview content
        publishQueue.previewAction(0);
        expect(publishQueue.getPreviewTitle()).toBe('item5');

        // can search item by headline
        publishQueue.searchAction('item5');
        expect(publishQueue.getItemCount()).toBe(1);
        publishQueue.searchAction('item6');
        browser.sleep(100);
        expect(publishQueue.getItemCount()).toBe(0);

        publishQueue.clearSearch();

        // can search item by unique name
        var _uniqueName = publishQueue.getUniqueName(0).getText();

        publishQueue.searchAction(_uniqueName);
        expect(publishQueue.getItemCount()).toBe(1);
    });

    it('stops publishing if there are validation errors', () => {
        workspace.selectDesk('Sports Desk');

        const thirdStage = els(['monitoring-group']).get(2);
        const output = els(['monitoring-group']).get(5);

        browser.wait(ECE.hasElementCount(
            els(['article-item'], null, output),
            0,
        ), MONITORING_DEBOUNCE_MAX_WAIT);

        browser.wait(ECE.hasElementCount(
            els(['article-item'], null, thirdStage),
            1,
        ), MONITORING_DEBOUNCE_MAX_WAIT);

        executeContextMenuAction(els(['article-item'], null, thirdStage).get(0), 'Edit');

        el(['authoring', 'open-send-publish-pane']).click();

        el(['authoring', 'interactive-actions-panel', 'tabs'], by.buttonText('Publish')).click();
        el(['authoring', 'interactive-actions-panel', 'publish']).click();

        assertToastMsg('error', 'SUBJECT is a required field');
        assertToastMsg('error', 'BODY HTML is a required field');

        browser.wait(ECE.hasElementCount(
            els(['article-item'], null, output),
            0,
        ), MONITORING_DEBOUNCE_MAX_WAIT);

        browser.wait(ECE.hasElementCount(
            els(['article-item'], null, thirdStage),
            1,
        ), MONITORING_DEBOUNCE_MAX_WAIT);
    });

    it('can send and publish', () => {
        workspace.selectDesk('Politic Desk');

        el(['content-create']).click();
        el(['content-create-dropdown']).element(by.buttonText('More templates...')).click();
        el(['select-template'], by.buttonText('testing')).click();

        const slugline = 'testing-send-and-publish';

        el(['authoring', 'field-slugline']).sendKeys(slugline);
        el(['authoring', 'save']).click();

        el(['authoring', 'open-send-publish-pane']).click();
        el(['authoring', 'send-publish-pane', 'tab--publish']).click();

        el(['authoring', 'send-publish-pane', 'publish-from--options', 'desk-select--handle']).click();
        el(
            ['authoring', 'send-publish-pane', 'publish-from--options', 'desk-select--options'],
            by.buttonText('Sports Desk'),
        ).click();

        el(['authoring', 'send-publish-pane', 'publish-from--submit']).click();

        assertToastMsg('success', 'Item published.');

        browser.wait(ECE.stalenessOf(element(by.cssContainingText(
            '[data-test-id="article-item"] [data-test-id="field--slugline"]',
            slugline,
        ))), MONITORING_DEBOUNCE_MAX_WAIT);

        workspace.selectDesk('Sports Desk');

        const output = els(['monitoring-group']).get(5);

        browser.wait(ECE.presenceOf(output.element(by.cssContainingText(
            '[data-test-id="article-item"] [data-test-id="field--slugline"]',
            slugline,
        ))), MONITORING_DEBOUNCE_MAX_WAIT);
    });
});
