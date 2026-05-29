import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {login, restoreDatabaseSnapshot, s} from './utils';

// Mentions a different user (admin1) which only exists in the 'legacy'
// snapshot. The Playwright storageState targets the 'main' user database,
// so we override it and log in fresh.
test.use({storageState: {cookies: [], origins: []}});

test('user mention notifies the mentioned user and clearing the badge', async ({page, browser}) => {
    await restoreDatabaseSnapshot({snapshotName: 'legacy'});

    // log in as the author and post a mention of admin1
    await login(page);

    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Politic Desk');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('article-item=item5')).first(),
        'Edit',
    );

    await page.locator(s('authoring-widget=Comments')).click();
    await page.locator(s('comments-widget', 'new-comment-input')).fill('@admin1 hello');
    await page.locator(s('comments-widget', 'new-comment-submit')).click();

    // The author should not see an unread badge for their own comment.
    // #unread-count is hidden via ng-show when notifications.unread is falsy,
    // so we assert it's not visible rather than asserting empty text.
    await expect(page.locator('#unread-count').first()).not.toBeVisible({timeout: 5000});

    // log in as admin1 in a fresh context; assert the unread badge appears,
    // then click clears it
    const admin1Context = await browser.newContext({storageState: {cookies: [], origins: []}});
    const admin1Page = await admin1Context.newPage();

    await admin1Page.goto('/');
    await admin1Page.locator(s('login-page', 'username')).fill('admin1');
    await admin1Page.locator(s('login-page', 'password')).fill('admin');
    await admin1Page.locator(s('login-page', 'submit')).click();

    await expect(admin1Page.locator(s('dashboard'))).toBeVisible();

    const unreadBadge = admin1Page.locator('#unread-count').first();

    await expect(unreadBadge).toBeVisible({timeout: 10000});
    await expect(unreadBadge).toHaveText('1');

    await unreadBadge.click();

    await expect(unreadBadge).not.toBeVisible({timeout: 5000});

    await admin1Context.close();
});
