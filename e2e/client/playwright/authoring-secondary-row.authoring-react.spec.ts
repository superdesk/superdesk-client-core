import {test, expect, Page, Response} from '@playwright/test';
import {Authoring, IEditorThemeKeys} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';
import {getUserPreference, setUserPreference} from './utils/preferences-api';
import {TOPBAR2_WIDGET_ENABLED} from '../test-extensions/topbar2-widget/extension';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),

    // dates in the row are formatted in the browser's timezone
    timezoneId: 'UTC',
});

// what angular stores for a user who never configured a theme
const ANGULAR_DEFAULT_THEME: IEditorThemeKeys = {
    font: 'sans',
    theme: 'default',
    headline: 'medium',
    abstract: 'medium',
    body: 'medium',
};

const DARK_LARGE_THEME: IEditorThemeKeys = {
    font: 'serif',
    theme: 'dark',
    headline: 'medium',
    abstract: 'medium',
    body: 'large',
};

const TRANSPARENT = '0,0,0,0';

function storeEditorThemes(themes: {theme: IEditorThemeKeys; proofreadTheme: IEditorThemeKeys}): Promise<void> {
    return setUserPreference('editor:theme', {
        type: 'string',
        theme: JSON.stringify(themes.theme),
        proofreadTheme: JSON.stringify(themes.proofreadTheme),
    });
}

async function openInSportsWorkingStage(page: Page, label: string): Promise<void> {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.executeActionOnMonitoringItem(
        monitoring.getGroupedArticleLocator('Sports / Working Stage', label),
        'Edit',
    );
    await expect(new Authoring(page).secondaryToolbar()).toBeVisible();
}

function openTestSportsStory(page: Page): Promise<void> {
    return openInSportsWorkingStage(page, 'test sports story');
}

test.describe('authoring-react secondary row: created and modified info', () => {
    test('shows when and by whom the item was created and when it was last modified', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openTestSportsStory(page);

        const row = new Authoring(page).secondaryToolbar();
        const created = row.getByTestId('created-info');
        const modified = row.getByTestId('modified-info');

        // `firstcreated` 2023-11-15T09:53:56Z, `versioncreated` 2024-01-19T13:14:46Z
        await expect(created.getByTestId('created-info--date')).toHaveText('11/15');
        await expect(created.getByTestId('created-info--date').locator('time')).toHaveAttribute('title', /2023/);
        await expect(created.getByTestId('created-info--user')).toHaveText('John Doe');
        await expect(modified.getByTestId('modified-info--date')).toHaveText('01/19');
        await expect(modified.getByTestId('modified-info--date').locator('time')).toHaveAttribute('title', /2024/);
    });

    test('shows the time of the save as the modified time after saving', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openTestSportsStory(page);

        const authoring = new Authoring(page);
        const modifiedDate = authoring.secondaryToolbar().getByTestId('modified-info--date');

        await expect(modifiedDate).toHaveText('01/19');

        await authoring.waitForAuthoringReactToInitialize();
        await authoring.replaceEditor3FieldText(authoring.fieldContainer('body_html').getByRole('textbox'), 'Edited');

        const saved = page.waitForResponse(
            (r: Response) => r.request().method() === 'PATCH' && r.url().includes('/api/archive/'),
        );

        await page.getByRole('button', {name: 'Save', exact: true}).click();

        const versioncreated = new Date((await (await saved).json()).versioncreated);

        // an item modified today shows the time
        const expected = [versioncreated.getUTCHours(), versioncreated.getUTCMinutes()]
            .map((value) => String(value).padStart(2, '0'))
            .join(':');

        await expect(modifiedDate).toHaveText(expected);
    });
});

test.describe('authoring-react secondary row: item state badge', () => {
    test('shows Draft for an item in personal space', async ({page}) => {
        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/personal');

        const monitoring = new Monitoring(page);

        await monitoring.executeActionOnMonitoringItem(
            monitoring.getGroupedArticleLocator('Personal Items', 'personal space article 1'),
            'Edit',
        );

        await expect(new Authoring(page).secondaryToolbar().getByTestId('authoring-item-state')).toHaveText('Draft');
    });

    test('shows Spiked for a spiked item', async ({page}) => {
        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/spike-monitoring');

        // a spiked item has no Edit or Open action, double clicking opens it read only
        await new Monitoring(page).getArticleLocator('Story 4').dblclick();

        await expect(new Authoring(page).secondaryToolbar().getByTestId('authoring-item-state')).toHaveText('Spiked');
    });
});

test.describe('authoring-react secondary row: print preview', () => {
    test('is offered for a picture, also by its shortcut', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});
        await openInSportsWorkingStage(page, 'Rivendell picture');

        await expect(new Authoring(page).secondaryToolbar().getByTestId('authoring-print-preview')).toBeVisible();

        await page.keyboard.press('Control+Shift+I');
        await expect(page.getByTestId('print-preview')).toBeVisible();
    });

    test('is not offered for a video, nor its shortcut', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});
        await openInSportsWorkingStage(page, 'Isengard video');

        const row = new Authoring(page).secondaryToolbar();
        const proofreadToggle = row.getByTestId('authoring-toggle-theme');

        // the row has rendered, so a missing button is hidden, not late
        await expect(proofreadToggle).toBeVisible();
        await expect(row.getByTestId('authoring-print-preview')).toHaveCount(0);

        // shortcuts run in order, so once the second has acted the first had its chance
        await page.keyboard.press('Control+Shift+I');
        await page.keyboard.press('Control+Shift+T');
        await expect(proofreadToggle).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByTestId('print-preview')).toHaveCount(0);
    });
});

test.describe('authoring-react secondary row: proofreading theme', () => {
    test('switches the content to the proofreading theme and back to a readable default', async ({page}) => {
        await restoreDatabaseSnapshot();
        await storeEditorThemes({theme: ANGULAR_DEFAULT_THEME, proofreadTheme: DARK_LARGE_THEME});
        await openTestSportsStory(page);

        const authoring = new Authoring(page);
        const toggle = authoring.secondaryToolbar().getByTestId('authoring-toggle-theme');

        await expect(toggle).toHaveAttribute('aria-pressed', 'false');
        await authoring.expectEditorTheme(ANGULAR_DEFAULT_THEME);

        const {bodyFontSize: defaultBodyFontSize} = await authoring.readThemeAppearance();

        await toggle.click();

        await expect(toggle).toHaveAttribute('aria-pressed', 'true');
        await authoring.expectEditorTheme(DARK_LARGE_THEME);
        await expect.poll(async () => (await authoring.readThemeAppearance()).bodyFontSize)
            .toBeGreaterThan(defaultBodyFontSize);

        const {background: proofreadingBackground} = await authoring.readThemeAppearance();

        await page.keyboard.press('Control+Shift+T');

        await expect(toggle).toHaveAttribute('aria-pressed', 'false');
        await authoring.expectEditorTheme(ANGULAR_DEFAULT_THEME);

        // Angular stores the default theme's colour as the key "default". Applied as a CSS colour, the
        // browser ignored it and kept the proofreading background behind the default theme's dark text.
        await expect.poll(async () => {
            const {background, text} = await authoring.readThemeAppearance();

            return background !== TRANSPARENT && background !== proofreadingBackground && text !== background;
        }).toBe(true);
    });

    test('saves a proofreading colour and size that survive a reload', async ({page}) => {
        await restoreDatabaseSnapshot();
        await storeEditorThemes({theme: ANGULAR_DEFAULT_THEME, proofreadTheme: ANGULAR_DEFAULT_THEME});
        await openTestSportsStory(page);

        const authoring = new Authoring(page);

        await authoring.secondaryToolbar().getByTestId('authoring-configure-themes').click();

        const proofreadingPanel = authoring.editorThemesPanel('proofreading');

        await proofreadingPanel.getByTestId('theme-color').and(page.locator('[data-test-value="dark"]')).click();
        await proofreadingPanel.getByTestId('theme-body-size')
            .getByTestId('item')
            .and(page.locator('[data-test-value="L"]'))
            .click();
        await page.getByTestId('editor-themes-save').click();
        await expect(page.getByTestId('editor-themes-modal')).toBeHidden();

        // stored in the shape angular reads
        await expect.poll(async () => JSON.parse((await getUserPreference('editor:theme')).proofreadTheme))
            .toEqual({...ANGULAR_DEFAULT_THEME, theme: 'dark', body: 'large'});

        await page.reload();
        await openTestSportsStory(page);

        await authoring.expectEditorTheme(ANGULAR_DEFAULT_THEME);

        await authoring.secondaryToolbar().getByTestId('authoring-toggle-theme').click();

        await authoring.expectEditorTheme({...ANGULAR_DEFAULT_THEME, theme: 'dark', body: 'large'});
    });
});

test.describe('authoring-react secondary row: themes stored by angular', () => {
    test('renders a default theme stored by angular', async ({page}) => {
        await restoreDatabaseSnapshot();
        await storeEditorThemes({theme: DARK_LARGE_THEME, proofreadTheme: ANGULAR_DEFAULT_THEME});
        await openTestSportsStory(page);

        await new Authoring(page).expectEditorTheme(DARK_LARGE_THEME);
    });

    test('selects the stored colours in the configure themes dialog', async ({page}) => {
        await restoreDatabaseSnapshot();
        await storeEditorThemes({theme: ANGULAR_DEFAULT_THEME, proofreadTheme: DARK_LARGE_THEME});
        await openTestSportsStory(page);

        await page.keyboard.press('Control+Shift+C');

        const authoring = new Authoring(page);
        const selectedColour = (slot: 'default' | 'proofreading') =>
            authoring.editorThemesPanel(slot)
                .getByTestId('theme-color')
                .and(page.getByRole('radio', {checked: true}));

        await expect(selectedColour('default')).toHaveAttribute('data-test-value', 'default');
        await expect(selectedColour('proofreading')).toHaveAttribute('data-test-value', 'dark');
    });
});

test.describe('authoring-react secondary row: spell checker', () => {
    test('turns spellchecking off and on from the row and with Alt+S', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'spellchecker'});
        await openInSportsWorkingStage(page, 'spellchecker test');

        const authoring = new Authoring(page);
        const toggle = authoring.secondaryToolbar().getByTestId('authoring-spellchecker-toggle');
        const warnings = authoring.fieldContainer('body_html').getByTestId('spellchecker-warning');

        await expect(toggle).toHaveAttribute('aria-pressed', 'true');
        await expect(toggle).toHaveAttribute('aria-label', 'Spell checker on (Alt+S)');
        await expect(warnings).toHaveCount(2);

        await toggle.click();

        await expect(toggle).toHaveAttribute('aria-pressed', 'false');
        await expect(toggle).toHaveAttribute('aria-label', 'Spell checker off (Alt+S)');
        await expect(warnings).toHaveCount(0);

        await page.keyboard.press('Alt+s');

        await expect(toggle).toHaveAttribute('aria-pressed', 'true');
        await expect(warnings).toHaveCount(2);

        await page.keyboard.press('Alt+s');

        await expect(toggle).toHaveAttribute('aria-pressed', 'false');
        await expect(warnings).toHaveCount(0);
    });

    test('is not offered when no spellchecker covers the item language', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openTestSportsStory(page);

        const row = new Authoring(page).secondaryToolbar();

        await expect(row.getByTestId('authoring-toggle-theme')).toBeVisible();
        await expect(row.getByTestId('authoring-spellchecker-toggle')).toHaveCount(0);
    });
});

test.describe('authoring-react secondary row: extensions', () => {
    test.use({
        storageState: getStorageState({}, {
            authoringReact: true,
            localStorageEntries: [{name: TOPBAR2_WIDGET_ENABLED, value: 'true'}],
        }),
    });

    test('renders a widget an extension contributes to the row', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openTestSportsStory(page);

        await expect(new Authoring(page).secondaryToolbar().getByTestId('e2e-topbar2-widget'))
            .toHaveText('Extension widget: test sports story');
    });
});
