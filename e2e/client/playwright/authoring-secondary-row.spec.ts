import {test, expect, Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';
import {setUserPreference} from './utils/preferences-api';
import {TOPBAR2_WIDGET_ENABLED} from '../test-extensions/topbar2-widget/extension';

async function openInSportsWorkingStage(page: Page, label: string): Promise<void> {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.executeActionOnMonitoringItem(
        monitoring.getGroupedArticleLocator('Sports / Working Stage', label),
        'Edit',
    );
    await expect(page.getByTestId('authoring-toggle-theme')).toBeVisible();
}

test.describe('authoring secondary row: print preview', () => {
    test('is offered without the preview feature', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openInSportsWorkingStage(page, 'test sports story');

        await expect(page.getByTestId('authoring-print-preview')).toBeVisible();
    });

    test('is not offered for a video', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        // opening waits for the proofreading toggle, so the row has rendered its buttons
        await openInSportsWorkingStage(page, 'Isengard video');

        await expect(page.getByTestId('authoring-print-preview')).toHaveCount(0);
    });
});

test.describe('authoring secondary row: themes stored by authoring-react', () => {
    test('applies a theme authoring-react stored as colours and a font family', async ({page}) => {
        await restoreDatabaseSnapshot();
        await setUserPreference('editor:theme', {
            type: 'string',
            theme: JSON.stringify({
                font: 'sans',
                theme: '#1b1e19',
                headline: 'medium',
                abstract: 'medium',
                body: 'large',
                fontFamily: '"Merriweather", Georgia, "Times New Roman", Times, serif',
                themeColorSecondary: '#23282e',
                textColor: 'white',
            }),
        });
        await openInSportsWorkingStage(page, 'test sports story');

        const article = new Authoring(page).themeContainer();

        // the exact list, so a stored colour or font family never leaks into a class name
        await expect.poll(async () => (await article.getAttribute('class') ?? '')
            .split(' ')
            .filter((name) => name.startsWith('sd-editor--'))
            .sort(),
        ).toEqual([
            'sd-editor--abstract-medium',
            'sd-editor--body-large',
            'sd-editor--font-serif',
            'sd-editor--headline-medium',
            'sd-editor--theme-dark',
        ]);
    });
});

test.describe('authoring secondary row: extensions', () => {
    test.use({
        storageState: getStorageState({}, {
            localStorageEntries: [{name: TOPBAR2_WIDGET_ENABLED, value: 'true'}],
        }),
    });

    test('renders a widget an extension contributes to the row', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openInSportsWorkingStage(page, 'test sports story');

        await expect(page.getByTestId('e2e-topbar2-widget')).toHaveText('Extension widget: test sports story');
    });
});
