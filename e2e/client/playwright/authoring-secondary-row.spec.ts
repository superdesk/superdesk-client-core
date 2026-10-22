import {test, expect, Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';
import {setUserPreference} from './utils/preferences-api';
import {TOPBAR2_WIDGET_ENABLED} from '../test-extensions/topbar2-widget/extension';

async function openItem(page: Page, item: string): Promise<void> {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.executeActionOnMonitoringItem(
        page.getByTestId('monitoring-group')
            .and(page.locator('[data-test-value="Sports / Working Stage"]'))
            .getByTestId('article-item')
            .filter({hasText: item})
            .first(),
        'Edit',
    );
    await expect(page.getByTestId('authoring-toggle-theme')).toBeVisible();
}

test.describe('authoring secondary row: print preview', () => {
    const cases: Array<{item: string, shown: boolean}> = [
        {item: 'test sports story', shown: true},
        {item: 'Rivendell picture', shown: true},
        {item: 'Isengard video', shown: false},
        {item: 'Shire package', shown: false},
    ];

    for (const {item, shown} of cases) {
        test(`is ${shown ? 'offered' : 'not offered'} for "${item}" without the preview feature`, async ({page}) => {
            await restoreDatabaseSnapshot({snapshotName: 'media-items'});
            await openItem(page, item);

            await expect(page.getByTestId('authoring-print-preview')).toHaveCount(shown ? 1 : 0);
        });
    }
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
        await openItem(page, 'test sports story');

        const article = page.getByTestId('authoring-theme-container');

        await expect(article).toHaveClass(/\bsd-editor--theme-dark\b/);
        await expect(article).toHaveClass(/\bsd-editor--font-serif\b/);
        await expect(article).toHaveClass(/\bsd-editor--body-large\b/);
        await expect(article).toHaveCSS('background-color', 'rgb(27, 30, 35)');

        const themeClasses = (await article.getAttribute('class') ?? '')
            .split(' ')
            .filter((name) => name.startsWith('sd-editor--'))
            .sort();

        expect(themeClasses).toEqual([
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
        await openItem(page, 'test sports story');

        await expect(page.getByTestId('e2e-topbar2-widget')).toHaveText('Extension widget: test sports story');
    });
});
