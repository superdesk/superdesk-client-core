import {test, expect, Page, APIRequestContext} from '@playwright/test';
import {Authoring, PackageAuthoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {assertOk, withApiContext} from './utils/api';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

async function findOne(api: APIRequestContext, resource: string, where: object): Promise<any> {
    const response = await api.get(resource, {params: {where: JSON.stringify(where)}});

    await assertOk(response, `finding ${resource} ${JSON.stringify(where)}`);

    const [found] = (await response.json())._items;

    if (found == null) {
        throw new Error(`no ${resource} matches ${JSON.stringify(where)}`);
    }

    return found;
}

// a highlight package only takes items marked today, and the snapshot's are older
function createArticleMarkedForHighlight(slugline: string, bodyHtml: string, highlightName: string): Promise<void> {
    return withApiContext(async (api) => {
        const desk = await findOne(api, 'desks', {name: 'Sports'});
        const highlight = await findOne(api, 'highlights', {name: highlightName});

        const created = await api.post('archive', {
            data: {
                type: 'text',
                slugline,
                body_html: bodyHtml,
                task: {desk: desk._id, stage: desk.working_stage},
            },
        });

        await assertOk(created, `creating "${slugline}"`);

        const marked = await api.post('marked_for_highlights', {
            data: {highlights: [highlight._id], marked_item: (await created.json())._id},
        });

        await assertOk(marked, `marking "${slugline}" for "${highlightName}"`);
    });
}

async function createHighlightsPackage(page: Page): Promise<PackageAuthoring> {
    await createArticleMarkedForHighlight('article 1', '<p>body html article</p>', 'Highlight 1');

    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.openHighlight('Highlight 1');
    await monitoring.createHighlightsPackage();

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
        await authoring.saveAndGetRequest();

        await page.goto('/#/workspace/monitoring');
        await expect(
            new Monitoring(page).getGroupedArticleLocator('Sports / Working Stage', 'Package Highlight 2'),
        ).toBeVisible();
    });

    test('exports a highlights package that has not been saved yet', async ({page}) => {
        await restoreDatabaseSnapshot();

        await createHighlightsPackage(page);

        await page.getByTestId('authoring').getByTestId('export-highlight').click();

        // the item in the highlight is not published, which the server asks to confirm
        await page.getByTestId('modal-confirm').getByRole('button', {name: 'ok'}).click();

        await expect(new Authoring(page).fieldContainer('body_html').getByRole('textbox'))
            .toContainText('body html article');
    });
});
