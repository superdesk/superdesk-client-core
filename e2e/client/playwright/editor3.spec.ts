import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test('can add embeds', async ({page}) => {
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

    await page.getByRole('button', {name: 'Embed'}).click();

    await page.getByPlaceholder('Enter URL or code to embed').type('https://sourcefabric.org');

    await page.locator(s('embed-controls', 'submit')).click();
    await expect(page.getByText('https://sourcefabric.org')).toBeDefined();
});
