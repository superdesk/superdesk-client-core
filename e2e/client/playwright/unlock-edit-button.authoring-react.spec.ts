import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {loginAs, restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

const ARTICLE = 'test sports story';

test('unlocking an item locked in another session hides the Edit button', async ({page, browser}) => {
    await restoreDatabaseSnapshot();

    // A second admin session takes the lock, so this page sees the item locked in another session.
    const otherSession = await browser.newContext({storageState: undefined});

    try {
        const otherPage = await otherSession.newPage();

        await loginAs(otherPage, 'admin', 'admin');
        await otherPage.goto('/#/workspace/monitoring');
        await new Monitoring(otherPage).selectDeskOrWorkspace('Sports');
        await new Monitoring(otherPage).getArticleLocator(ARTICLE).dblclick();
        await expect(otherPage.getByTestId('authoring').getByTestId('save')).toBeVisible();
    } finally {
        await otherSession.close();
    }

    const monitoring = new Monitoring(page);
    const authoring = page.getByTestId('authoring');

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.getArticleLocator(ARTICLE).dblclick();

    await expect(authoring.getByTestId('locked-info')).toBeVisible();
    await expect(authoring.getByTestId('edit')).toBeVisible();

    await authoring.getByTestId('unlock').click();

    await expect(authoring.getByTestId('save')).toBeVisible();
    await expect(authoring.getByTestId('locked-info')).toHaveCount(0);
    await expect(authoring.getByTestId('edit')).toHaveCount(0);
});
