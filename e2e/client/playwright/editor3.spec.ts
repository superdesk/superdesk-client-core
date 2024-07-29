import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';
import {appConfig} from 'scripts/appConfig';

test('can add embeds', async ({page}) => {
    await restoreDatabaseSnapshot();

    const monitoring = new Monitoring(page);

    const requestRoute = 'https://sourcefabric.org';

    await page.route(
        `https://iframe.ly/api/oembed?callback=?&url=
        ${requestRoute}
        &api_key=${appConfig.iframely.key}
        &omit_script=true&iframe=true`,
        (route) => {
            route.fulfill({
                body: JSON.stringify([{
                    title: 'Open Source Software for Journalism',
                    // eslint-disable-next-line max-len
                    description: 'Sourcefabric is Europe\'s largest developer of '
                    + 'open source tools for news media, powering news and media organisations around the world.',
                }]),
            });
        },
    );
    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDesk('Sports');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    ).dblclick();

    await page.getByRole('button', {name: 'Embed'}).click();

    await page.getByPlaceholder('Enter URL or code to embed').type('https://sourcefabric.org');

    await page.locator(s('embed-controls', 'submit')).click();
    await expect(
        page.locator(s('authoring', 'authoring-field=body_html')).getByText('https://sourcefabric.org'),
    ).toBeDefined();
});
