import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';

test('exporting selected items produces a downloadable file and closes the modal', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeBulkAction('Export', ['test sports story', 'story 2']);

    const exportResponse = page.waitForResponse(
        (r) => r.url().includes('/api/export') && r.request().method() === 'POST',
    );

    await monitoring.confirmExport();

    const response = await exportResponse;

    expect(response.status()).toBe(201);

    const {url} = await response.json();

    expect(url).toBeTruthy();

    // The app downloads from a browser context; verify the artifact directly via
    // an API request, which is not subject to the client<->server CORS boundary.
    const file = await page.request.get(url);

    expect(file.status()).toBe(200);
    expect(file.headers()['content-disposition'] ?? '').toContain('attachment');

    await expect(page.getByTestId('export-confirm')).not.toBeVisible();
});
