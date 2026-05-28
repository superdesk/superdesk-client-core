import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {login, restoreDatabaseSnapshot, s} from './utils';

// The legacy snapshot ships its own users/auth tokens, so the storageState
// captured against the `main` snapshot does not authenticate. Reset cookies
// for this file and log in explicitly.
test.use({storageState: {cookies: [], origins: []}});

test('stops publishing if there are validation errors', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot({snapshotName: 'legacy'});
    await login(page);

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports Desk');

    const thirdStage = page.locator(s('monitoring-group=Sports Desk / one'));
    const output = page.locator(s('monitoring-group=Sports Desk desk output'));

    await expect(thirdStage.locator(s('article-item'))).toHaveCount(1);
    await expect(output.locator(s('article-item'))).toHaveCount(0);

    await monitoring.executeActionOnMonitoringItem(
        thirdStage.locator(s('article-item')).first(),
        'Edit',
    );

    await page.locator(s('authoring', 'open-send-publish-pane')).click();
    await page.locator(s('authoring', 'interactive-actions-panel', 'tabs'))
        .getByRole('tab', {name: 'Publish'}).click();
    await page.locator(s('authoring', 'interactive-actions-panel', 'publish')).click();

    await expect(page.locator(s('notification--error=SUBJECT is a required field'))).toBeVisible();
    await expect(page.locator(s('notification--error=BODY HTML is a required field'))).toBeVisible();

    await expect(thirdStage.locator(s('article-item'))).toHaveCount(1);
    await expect(output.locator(s('article-item'))).toHaveCount(0);
});
