import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {Authoring} from './page-object-models/authoring';
import {restoreDatabaseSnapshot, s} from './utils';

test('live suggestions opens with no items', async ({page}) => {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.createArticleFromTemplate('story');
    await authoring.executeActionInEditor('Live suggestions');

    await expect(page.locator(s('live-suggestions'))).toBeVisible();
    await expect(page.locator(s('live-suggestions', 'suggestion-item'))).toHaveCount(0);
});
