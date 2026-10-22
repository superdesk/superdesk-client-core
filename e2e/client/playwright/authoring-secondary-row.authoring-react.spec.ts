import {test, expect, Locator, Page, Response} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
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

const WHITE = 'rgb(255, 255, 255)';
const DARK = 'rgb(27, 30, 35)';
const TEXT_ON_LIGHT = 'lch(10 13 260)'; // --color-text-onlight
const TEXT_ON_DARK = 'lch(100 0 260)'; // --color-text-ondark
const INTERACTIVE_ACTIVE = 'rgb(51, 122, 153)'; // --sd-colour-interactive--active

// what angular stores for a user who never configured a theme
const ANGULAR_DEFAULT_THEME = {font: 'sans', theme: 'default', headline: 'medium', abstract: 'medium', body: 'medium'};
const DARK_LARGE_THEME = {font: 'serif', theme: 'dark', headline: 'medium', abstract: 'medium', body: 'large'};

function storeEditorThemes(themes: {theme: object; proofreadTheme: object}): Promise<void> {
    return setUserPreference('editor:theme', {
        type: 'string',
        theme: JSON.stringify(themes.theme),
        proofreadTheme: JSON.stringify(themes.proofreadTheme),
    });
}

async function openItem(
    page: Page,
    options: {workspace?: string, desk?: string, group?: string, item: string, action?: string | null},
): Promise<void> {
    const monitoring = new Monitoring(page);

    await page.goto(`/#/workspace/${options.workspace ?? 'monitoring'}`);

    if (options.desk != null) {
        await monitoring.selectDeskOrWorkspace(options.desk);
    }

    const group = options.group == null
        ? page
        : page.getByTestId('monitoring-group').and(page.locator(`[data-test-value="${options.group}"]`));

    const item = group.getByTestId('article-item').filter({hasText: options.item}).first();

    if (options.action === null) {
        await item.dblclick();
    } else {
        await monitoring.executeActionOnMonitoringItem(item, options.action ?? 'Edit');
    }

    await expect(row(page)).toBeVisible();
    await new Authoring(page).waitForAuthoringReactToInitialize();
}

function openTestSportsStory(page: Page): Promise<void> {
    return openItem(page, {desk: 'Sports', group: 'Sports / Working Stage', item: 'test sports story'});
}

function row(page: Page): Locator {
    return page.getByTestId('authoring-secondary-toolbar');
}

function bodyTheme(page: Page): Promise<{background: string, color: string, fontSize: string, fontFamily: string}> {
    return new Authoring(page).fieldContainer('body_html').getByRole('textbox').evaluate((textbox) => {
        const section = textbox.closest('.authoring-section') as HTMLElement;
        const style = window.getComputedStyle(textbox);
        let styled: HTMLElement | null = textbox as HTMLElement;

        // the e2e client forces Arial over every font, so read the family the theme set inline
        while (styled != null && styled.style.fontFamily === '') {
            styled = styled.parentElement;
        }

        return {
            background: window.getComputedStyle(section).backgroundColor,
            color: style.color,
            fontSize: style.fontSize,
            fontFamily: styled?.style.fontFamily ?? '',
        };
    });
}

test.describe('authoring-react secondary row: created and modified info', () => {
    test('shows when and by whom the item was created and when it was last modified', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openTestSportsStory(page);

        const created = row(page).getByTestId('created-info');
        const modified = row(page).getByTestId('modified-info');

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
        const modifiedDate = row(page).getByTestId('modified-info--date');

        await expect(modifiedDate).toHaveText('01/19');

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
        await openItem(page, {workspace: 'personal', item: 'personal space article 1'});

        await expect(row(page).getByTestId('authoring-item-state')).toHaveText('Draft');
    });

    test('shows Spiked for a spiked item', async ({page}) => {
        await restoreDatabaseSnapshot();

        // a spiked item has no Edit or Open action, double clicking opens it read only
        await openItem(page, {workspace: 'spike-monitoring', item: 'Story 4', action: null});

        await expect(row(page).getByTestId('authoring-item-state')).toHaveText('Spiked');
    });
});

test.describe('authoring-react secondary row: print preview', () => {
    const cases: Array<{item: string, shown: boolean}> = [
        {item: 'test sports story', shown: true},
        {item: 'Rivendell picture', shown: true},
        {item: 'Isengard video', shown: false},
        {item: 'Shire package', shown: false},
    ];

    for (const {item, shown} of cases) {
        test(`is ${shown ? 'offered' : 'not offered'} for "${item}"`, async ({page}) => {
            await restoreDatabaseSnapshot({snapshotName: 'media-items'});
            await openItem(page, {desk: 'Sports', group: 'Sports / Working Stage', item});

            // the toggle is always there, so the row has rendered its buttons
            await expect(row(page).getByTestId('authoring-toggle-theme')).toBeVisible();
            await expect(row(page).getByTestId('authoring-print-preview')).toHaveCount(shown ? 1 : 0);

            await page.keyboard.press('Control+Shift+I');
            await expect(page.getByTestId('print-preview')).toHaveCount(shown ? 1 : 0);
        });
    }
});

test.describe('authoring-react secondary row: proofreading theme', () => {
    test('switches the content to the proofreading theme and back, showing the toggle pressed', async ({page}) => {
        await restoreDatabaseSnapshot();
        await storeEditorThemes({theme: ANGULAR_DEFAULT_THEME, proofreadTheme: DARK_LARGE_THEME});
        await openTestSportsStory(page);

        const toggle = row(page).getByTestId('authoring-toggle-theme');

        await expect(toggle).toHaveAttribute('aria-pressed', 'false');
        expect(await bodyTheme(page)).toMatchObject({background: WHITE, color: TEXT_ON_LIGHT, fontSize: '16px'});

        await toggle.click();

        await expect(toggle).toHaveAttribute('aria-pressed', 'true');
        await expect(toggle).toHaveCSS('background-color', INTERACTIVE_ACTIVE);
        await expect(toggle).toHaveCSS('color', WHITE);
        expect(await bodyTheme(page)).toMatchObject({background: DARK, color: TEXT_ON_DARK, fontSize: '18px'});
        expect((await bodyTheme(page)).fontFamily).toContain('Merriweather');

        await toggle.click();

        await expect(toggle).toHaveAttribute('aria-pressed', 'false');
        expect(await bodyTheme(page)).toMatchObject({background: WHITE, color: TEXT_ON_LIGHT, fontSize: '16px'});
    });

    test('restores the default background when proofreading is toggled off', async ({page}) => {
        await restoreDatabaseSnapshot();

        // the default theme as angular stores it, which react used to apply as an invalid colour
        await storeEditorThemes({theme: ANGULAR_DEFAULT_THEME, proofreadTheme: DARK_LARGE_THEME});
        await openTestSportsStory(page);

        await page.keyboard.press('Control+Shift+T');
        await expect.poll(async () => (await bodyTheme(page)).background).toBe(DARK);

        await page.keyboard.press('Control+Shift+T');
        await expect.poll(async () => (await bodyTheme(page)).background).toBe(WHITE);
        expect((await bodyTheme(page)).color).toBe(TEXT_ON_LIGHT);
    });

    test('saves a proofreading colour and size that survive a reload', async ({page}) => {
        await restoreDatabaseSnapshot();
        await storeEditorThemes({theme: ANGULAR_DEFAULT_THEME, proofreadTheme: ANGULAR_DEFAULT_THEME});
        await openTestSportsStory(page);

        await row(page).getByTestId('authoring-configure-themes').click();

        const proofreadingPanel = page.getByTestId('editor-themes-modal').locator('.proofreading-panel').nth(1);

        await proofreadingPanel.getByTestId('theme-color').and(page.locator('[data-test-value="dark"]')).click();
        await proofreadingPanel.getByRole('radiogroup').nth(2).getByText('L', {exact: true}).click();
        await page.getByRole('dialog').getByRole('button', {name: 'Save', exact: true}).click();
        await expect(page.getByTestId('editor-themes-modal')).toBeHidden();

        // stored in the shape angular reads
        await expect.poll(async () => JSON.parse((await getUserPreference('editor:theme')).proofreadTheme))
            .toEqual({...ANGULAR_DEFAULT_THEME, theme: 'dark', body: 'large'});

        await page.reload();
        await openTestSportsStory(page);

        expect(await bodyTheme(page)).toMatchObject({background: WHITE, fontSize: '16px'});

        await row(page).getByTestId('authoring-toggle-theme').click();

        expect(await bodyTheme(page)).toMatchObject({background: DARK, color: TEXT_ON_DARK, fontSize: '18px'});
    });
});

test.describe('authoring-react secondary row: themes stored by angular', () => {
    test('renders a default theme stored by angular', async ({page}) => {
        await restoreDatabaseSnapshot();
        await storeEditorThemes({theme: DARK_LARGE_THEME, proofreadTheme: ANGULAR_DEFAULT_THEME});
        await openTestSportsStory(page);

        const theme = await bodyTheme(page);

        expect(theme).toMatchObject({background: DARK, color: TEXT_ON_DARK, fontSize: '18px'});
        expect(theme.fontFamily).toContain('Merriweather');
    });

    test('selects the stored colours in the configure themes dialog and shows readable samples', async ({page}) => {
        await restoreDatabaseSnapshot();
        await storeEditorThemes({theme: ANGULAR_DEFAULT_THEME, proofreadTheme: DARK_LARGE_THEME});
        await openTestSportsStory(page);

        await page.keyboard.press('Control+Shift+C');

        const panels = page.getByTestId('editor-themes-modal').locator('.proofreading-panel');
        const selected = (panel: Locator) => panel.locator('.color-selector__swatch--selected');

        await expect(selected(panels.nth(0))).toHaveAttribute('data-test-value', 'default');
        await expect(selected(panels.nth(1))).toHaveAttribute('data-test-value', 'dark');
        await expect(panels.nth(0).locator('.proofreading-panel-content')).toHaveCSS('background-color', WHITE);
        await expect(panels.nth(0).locator('.proofreading-panel-content')).toHaveCSS('color', TEXT_ON_LIGHT);
        await expect(panels.nth(1).locator('.proofreading-panel-content')).toHaveCSS('background-color', DARK);
        await expect(panels.nth(1).locator('.proofreading-panel-content')).toHaveCSS('color', TEXT_ON_DARK);
    });
});

test.describe('authoring-react secondary row: spell checker', () => {
    test('turns spellchecking off and on from the row and with Alt+S', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'spellchecker'});
        await openItem(page, {desk: 'Sports', group: 'Sports / Working Stage', item: 'spellchecker test'});

        const toggle = row(page).getByTestId('authoring-spellchecker-toggle');
        const warnings = new Authoring(page).fieldContainer('body_html').getByTestId('spellchecker-warning');

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

        await expect(row(page).getByTestId('authoring-toggle-theme')).toBeVisible();
        await expect(row(page).getByTestId('authoring-spellchecker-toggle')).toHaveCount(0);
    });
});

test.describe('authoring-react secondary row: shortcuts', () => {
    test('opens print preview, toggles the proofreading theme and opens the theme settings', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openTestSportsStory(page);

        await page.keyboard.press('Control+Shift+I');
        await expect(page.getByTestId('print-preview')).toBeVisible();
        await page.getByRole('button', {name: 'Close', exact: true}).last().click();
        await expect(page.getByTestId('print-preview')).toBeHidden();

        const toggle = row(page).getByTestId('authoring-toggle-theme');

        await page.keyboard.press('Control+Shift+T');
        await expect(toggle).toHaveAttribute('aria-pressed', 'true');

        await page.keyboard.press('Control+Shift+C');
        await expect(page.getByTestId('editor-themes-modal')).toBeVisible();
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

        await expect(row(page).getByTestId('e2e-topbar2-widget')).toHaveText('Extension widget: test sports story');
    });
});
