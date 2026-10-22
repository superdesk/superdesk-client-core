import {test, expect, Page} from '@playwright/test';
import {Authoring, PackageAuthoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

/**
 * A highlight package only takes items marked for the highlight today, and every item in the
 * snapshot is older, so one is written for the test.
 */
async function createHighlightsPackage(page: Page): Promise<PackageAuthoring> {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.createArticleFromTemplate('story');
    await authoring.waitForAuthoringReactToInitialize();
    await authoring.replaceEditor3FieldText(authoring.fieldContainer('slugline').getByRole('textbox'), 'article 1');
    await authoring.replaceEditor3FieldText(
        authoring.fieldContainer('body_html').getByRole('textbox'),
        'body html article',
    );
    await page.getByRole('button', {name: 'Save', exact: true}).click();
    await expect(page.getByRole('button', {name: 'Save', exact: true})).toBeDisabled();

    await monitoring.executeActionOnMonitoringItem(
        monitoring.getGroupedArticleLocator('Sports / Working Stage', 'article 1'),
        'Mark for highlight',
        'Highlight 1',
    );

    await page.getByTestId('workspace-navigation').getByRole('button', {name: 'Highlights'}).hover();
    await page.getByTestId('workspace-navigation').getByRole('button', {name: 'Highlight 1'}).click();
    await page.getByTestId('articles-list--toolbar').getByRole('button', {name: 'Create'}).click();

    const packageAuthoring = new PackageAuthoring(page);

    await expect(packageAuthoring.item('article 1')).toBeVisible();

    return packageAuthoring;
}

test.describe('highlights package (authoring-react)', () => {
    test('creates a highlights package and shows what it exports to', async ({page}) => {
        await restoreDatabaseSnapshot();

        const authoring = await createHighlightsPackage(page);

        await expect(authoring.fieldContainer('groups').getByTestId('package-highlight-preview-content'))
            .toContainText('body html article');

        await authoring.waitForAuthoringReactToInitialize();
        await authoring.replaceEditor3FieldText(
            authoring.fieldContainer('headline').getByRole('textbox'),
            'Package Highlight 2',
        );
        await page.getByRole('button', {name: 'Save', exact: true}).click();
        await expect(page.getByRole('button', {name: 'Save', exact: true})).toBeDisabled();

        await page.goto('/#/workspace/monitoring');
        await expect(
            new Monitoring(page).getGroupedArticleLocator('Sports / Working Stage', 'Package Highlight 2'),
        ).toBeVisible();
    });

    test('exports a highlights package that has not been saved yet', async ({page}) => {
        await restoreDatabaseSnapshot();

        await createHighlightsPackage(page);

        await page.getByRole('button', {name: 'Export', exact: true}).click();

        // the item in the highlight is not published, which the server asks to confirm
        await page.getByTestId('modal-confirm').getByRole('button', {name: 'ok'}).click();

        await expect(new Authoring(page).fieldContainer('body_html').getByRole('textbox'))
            .toContainText('body html article');
    });
});
