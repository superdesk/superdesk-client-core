import {test, expect, Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

const ARTICLE = 'test sports story';
const WIDGET = 'Comments';

/**
 * Which implementation renders authoring is decided at load time from the `auth-react` local
 * storage flag, so switching needs a real reload. The open article and its action live in the
 * URL query, which means the reload reopens authoring by itself, exactly as in the bug report.
 */
async function switchAuthoringImplementationAndReload(page: Page, authoringReact: boolean): Promise<void> {
    await page.evaluate(
        (enabled) => localStorage.setItem('auth-react', JSON.stringify(enabled)),
        authoringReact,
    );

    await page.reload();
}

/**
 * A widget id the implementation can not resolve used to throw React's "Element type is
 * invalid" (minified as React error #130) while rendering, which unmounts the whole authoring
 * view. React surfaces it both as an uncaught exception and through console.error, and the app
 * emits unrelated console errors (404s, unhandled rejections), so only React's own are kept.
 */
function collectReactRenderErrors(page: Page): Array<string> {
    const errors: Array<string> = [];
    const isReactRenderError = (text: string) =>
        text.includes('Minified React error') || text.includes('Element type is invalid');

    page.on('pageerror', (error) => {
        if (isReactRenderError(error.message)) {
            errors.push(error.message);
        }
    });

    page.on('console', (message) => {
        if (message.type() === 'error' && isReactRenderError(message.text())) {
            errors.push(message.text());
        }
    });

    return errors;
}

async function openArticleForEditing(page: Page): Promise<void> {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    const workingStage = page.getByTestId('monitoring-group')
        .and(page.locator('[data-test-value="Sports / Working Stage"]'));

    await monitoring.executeActionOnMonitoringItem(
        workingStage.getByTestId('article-item').filter({hasText: ARTICLE}),
        'Edit',
    );
}

test.describe('widget pinned in authoring-angular', () => {
    test.use({storageState: getStorageState({})});

    test('is still pinned, and does not crash the view, after switching to authoring-react', async ({page}) => {
        await restoreDatabaseSnapshot();

        const reactRenderErrors = collectReactRenderErrors(page);

        await openArticleForEditing(page);

        const widgetTab = page.getByTestId('authoring-widget')
            .and(page.locator(`[data-test-value="${WIDGET}"]`));

        await widgetTab.click();

        const angularPanel = page.getByTestId('authoring-widget-panel');

        await expect(angularPanel).toBeVisible();

        // pinning is only persisted once the preferences PATCH lands, and the reload below
        // has to happen after it or the switch reads a stale preference
        await Promise.all([
            page.waitForResponse((response) =>
                response.url().includes('/preferences/') && response.request().method() === 'PATCH'),
            angularPanel.getByTestId('pin-widget').click(),
        ]);

        await switchAuthoringImplementationAndReload(page, true);

        // no click here: the panel can only be open because the pinned preference was honoured
        const reactPanel = page.getByTestId('authoring-widget-panel');

        await expect(reactPanel).toBeVisible();
        await expect(reactPanel.getByText(WIDGET, {exact: true})).toBeVisible();

        // the throw happens while rendering the widget, so this is checked after it rendered
        await expect(page.getByTestId('authoring')).toBeVisible();
        expect(reactRenderErrors).toEqual([]);
    });
});

test.describe('widget pinned in authoring-react', () => {
    test.use({storageState: getStorageState({}, {authoringReact: true})});

    test('is still pinned, and does not crash the view, after switching to authoring-angular', async ({page}) => {
        await restoreDatabaseSnapshot();

        const reactRenderErrors = collectReactRenderErrors(page);

        await openArticleForEditing(page);

        await page.getByTestId('widget-icon')
            .and(page.locator('[data-test-value="comments"]'))
            .click();

        const reactPanel = page.getByTestId('authoring-widget-panel');

        await expect(reactPanel).toBeVisible();

        // the ui-framework IconButton renders no data-test-id, only the aria label
        await Promise.all([
            page.waitForResponse((response) =>
                response.url().includes('/preferences/') && response.request().method() === 'PATCH'),
            reactPanel.getByRole('button', {name: 'Pin'}).click(),
        ]);

        await switchAuthoringImplementationAndReload(page, false);

        const angularPanel = page.getByTestId('authoring-widget-panel')
            .and(page.locator(`[data-test-value="${WIDGET}"]`));

        await expect(angularPanel).toBeVisible();

        await expect(page.getByTestId('authoring')).toBeVisible();
        expect(reactRenderErrors).toEqual([]);
    });
});
