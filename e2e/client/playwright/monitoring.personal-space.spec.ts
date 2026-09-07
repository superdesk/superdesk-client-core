import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test('creating an article in personal space', {
    annotation: [
        {type: 'confluence', description: '1311835196 complete'}, // Create new article in Personal space (AUTOMATED)
        // Create new article from a template in Personal space
        {type: 'confluence', description: '1311835206 complete'},
    ],
}, async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/personal');

    await monitoring.createArticleFromTemplate('story', {slugline: 'article 1'});
    await page.locator(s('authoring-topbar', 'save')).click();
    await expect(page.locator(s('monitoring-group=Personal Items', 'article-item=article 1'))).toBeVisible();
});

test('editing an article in personal space', {
    annotation: [
        {type: 'confluence', description: '1311835208 complete'}, // Edit article in Personal space (AUTOMATED)
    ],
}, async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/personal');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('article-item=personal space article 1')),
        'Edit',
    );
    await page.locator(s('authoring', 'field-slugline')).fill('personal space article 1.1');
    await page.locator(s('authoring-topbar', 'save')).click();
    await expect(
        page.locator(s('monitoring-group=Personal Items', 'article-item=personal space article 1')),
    ).not.toBeVisible();
    await expect(
        page.locator(s('monitoring-group=Personal Items', 'article-item=personal space article 1.1')),
    ).toBeVisible();
});

test('copying an article in personal space', {
    annotation: [
        {type: 'confluence', description: '1311835212 complete'}, // Copy article in Personal space (AUTOMATED)
    ],
}, async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/personal');

    await expect(page.locator(s('article-item=personal space article 1'))).toHaveCount(1);

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('article-item=personal space article 1')),
        'Copy',
    );

    await expect(page.locator(s('article-item=personal space article 1'))).toHaveCount(2);
});

test('sending an item from personal space', {
    annotation: [
        {type: 'confluence', description: '1311835216 complete'}, // Send item from Personal space (AUTOMATED)
    ],
}, async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/personal');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('article-item=personal space article 1')),
        'Send to',
    );
    await page.locator(s('destination-select', 'open-popover')).click();
    await page.locator(s('tree-select-popover')).locator(s('option'), {hasText: 'Sports'}).click();
    await page.locator(s('interactive-actions-panel')).locator(s('item'), {hasText: 'Working Stage'}).check();
    await page.locator(s('interactive-actions-panel', 'send')).click();

    await expect(
        page.locator(s('monitoring-group=Personal Items', 'article-item=personal space article 1')),
    ).not.toBeVisible();

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await expect(
        page.locator(s(
            'monitoring-group=Sports / Working Stage',
            'article-item=personal space article 1',
        )),
    ).toBeVisible();
});
