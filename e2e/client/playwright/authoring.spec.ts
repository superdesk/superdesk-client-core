import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test('applying "populate abstract" macro', async ({page}) => {
    await restoreDatabaseSnapshot();

    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    ).dblclick();

    await expect(
        page.locator(s('authoring', 'authoring-field=body_html')).getByRole('textbox'),
    ).toHaveText('test sport story body');

    await expect(
        page.locator(s('authoring', 'authoring-field=abstract')).getByRole('textbox'),
    ).toHaveText('');

    await page.locator(
        s('authoring-widget=Macros'),
    ).click();

    await page.locator(s('authoring-widget-panel=Macros'))
        .getByRole('button', {name: 'Populate Abstract'})
        .click();

    await page.getByTitle('Macros (ctrl+alt+6)').click();
    await page.getByRole('button', {name: 'Populate Abstract'}).click();

    await expect(
        page.locator(s('authoring', 'authoring-field=abstract')).getByRole('textbox'),
    ).toHaveText('test sport story body');
});

test('cancel and ignore buttons from unsaved changes modal', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    // create article without saving
    await monitoring.createArticleFromTemplate('story', {slugline: 'new article'});

    // check unsaved changes modal is visible
    await page.locator(s('authoring-topbar', 'close')).click();
    await expect(page.locator(s('unsaved-changes-dialog')).getByRole('dialog')).toBeVisible();

    // button - cancel
    await page.locator(s('unsaved-changes-dialog')).getByRole('button', {name: 'cancel'}).click();
    await expect(page.locator(s('authoring'))).toBeVisible();

    // button - ignore
    await page.locator(s('authoring-topbar', 'close')).click();
    await page.locator(s('unsaved-changes-dialog')).getByRole('button', {name: 'ignore'}).click();
    await expect(page.locator(s('authoring'))).not.toBeVisible();
    await expect(page.locator(s('monitoring-view', 'article-item=new article'))).not.toBeVisible();
});

test('save button from unsaved changes modal', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    // create article without saving
    await monitoring.createArticleFromTemplate('story', {slugline: 'new article'});

    // button - save
    await page.locator(s('authoring-topbar', 'close')).click();
    await page.locator(s('unsaved-changes-dialog')).getByRole('button', {name: 'save'}).click();
    await expect(page.locator(s('authoring'))).not.toBeVisible();
    await expect(page.locator(s('monitoring-view', 'article-item=new article'))).toBeVisible();
});

test('setting embargo', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await expect(page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    )).toBeVisible();

    await expect(page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    )).not.toContainText('embargo');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    ).dblclick();

    await page.locator(s('authoring', 'open-send-publish-pane')).click();

    const embargoDate = '09/09/' + ((new Date()).getFullYear() + 1);
    const embargoTime = '04:00';

    await page.locator(
        s('authoring', 'interactive-actions-panel', 'embargo', 'date-input'),
    ).pressSequentially(embargoDate);

    await page.locator(
        s('authoring', 'interactive-actions-panel', 'embargo', 'time-input'),
    ).pressSequentially(embargoTime);

    await page.locator(s('authoring', 'interactive-actions-panel')).getByRole('button', {name: 'Close'}).click();

    await page.locator(s('authoring-topbar', 'save')).click();

    // make sure label appears inside article item in the monitoring list
    await expect(page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    )).toContainText('Embargo');

    // make sure label appears inside metadata widget
    await page.locator(s('authoring-widget=Info')).click();
    await expect(page.locator(
        s('authoring-widget-panel=Info'),
    )).toContainText('embargo');
});
