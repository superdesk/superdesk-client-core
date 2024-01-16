import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {login, restoreDatabaseSnapshot, s} from './utils';

test('can apply macro', async ({page}) => {
    await restoreDatabaseSnapshot();
    await login(page);

    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDesk('Politic Desk');

    await page.locator(
        s('monitoring-group=Politic Desk / two', 'article-item=item6'),
    ).dblclick();

    await expect(
        page.locator(s('authoring', 'authoring-field=body_html')).getByRole('textbox'),
    ).toHaveText('item6 text');

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
    ).toHaveText('item6 text');
});
