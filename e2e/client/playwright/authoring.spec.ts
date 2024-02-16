import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test('can apply "populate abstract" macro', async ({page}) => {
    await restoreDatabaseSnapshot();

    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDesk('Sports');

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

test('can embed if url is valid', async ({page}) => {
    await restoreDatabaseSnapshot();

    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDesk('Sports');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    ).dblclick();

    await expect(
        page.locator(s('authoring', 'authoring-field=body_html')).getByRole('textbox'),
    ).toHaveText('test sport story body');

    await page.locator(s('Embed')).getByRole('button').click();

    await page.getByPlaceholder('Enter URL or code to embed').type('https://google.com');

    await page.locator(s('embed-controls', 'submit')).click();
    await expect(page.getByText('https://google.com')).toBeDefined();
});
