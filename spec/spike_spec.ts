/* eslint-disable newline-per-chained-call */

import {browser} from 'protractor';

import {monitoring} from './helpers/monitoring';
import {workspace} from './helpers/workspace';
import {content} from './helpers/content';
import {nav} from './helpers/utils';
import {ECE, els, el} from 'end-to-end-testing-helpers';

describe('spike', () => {
    beforeEach((done) => {
        nav('/workspace/content').then(done);
    });

    it('can spike item', () => {
        workspace.switchToDesk('PERSONAL');
        content.setListView();

        var personalCount;

        content.getItems().count().then((count) => {
            personalCount = count;
        });

        content.actionOnItem('Spike Item', 0, null, true);

        // check that there are less items than before
        browser.wait(() => content.getItems().count().then((count) => count < personalCount), 3000);
    });

    it('can spike and unspike multiple items', () => {
        monitoring.openMonitoring();

        monitoring.selectItem(2, 2);
        monitoring.selectItem(2, 3);

        content.spikeItems();

        monitoring.showSpiked();
        browser.wait(
            ECE.hasElementCount(
                els(['article-item'], null, el(['articles-list'])),
                2,
            ),
        );

        content.selectItem(0);
        content.selectItem(1);
        content.unspikeItems();

        browser.wait(
            ECE.hasElementCount(
                els(['article-item'], null, el(['articles-list'])),
                0,
            ),
        );
    });
});
