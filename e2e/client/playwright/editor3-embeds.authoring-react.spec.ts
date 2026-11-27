import {test, expect, type Locator, type Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {AuthoringReact} from './page-object-models/authoring-react';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';
import {addEditor3Embed} from './utils/editor3';
import {openArticleFromList} from './scenarios/authoring-react-article';

/**
 * Embeds and tables in the body on authoring-react: adding, editing and removing an embed, and
 * adding a table. No snapshot carries an embed, so the edit and remove cases add theirs through
 * the add-embed flow first, as edit-embed.spec.ts and remove-embed.spec.ts do on angular.
 */

test.use({storageState: getStorageState({}, {authoringReact: true})});

test.setTimeout(90000);

const ARTICLE = 'test sports story';

/**
 * Self-contained HTML keyed by URL, so each embed renders at once and is identifiable after a
 * reopen. An "iframe.ly" src would make EmbedBlock load iframely, whose re-renders detach the
 * hover controls mid-interaction.
 */
const EMBEDS = [
    {url: 'https://a.example.com', marker: 'embed-a', html: '<blockquote class="embed-a">A content</blockquote>'},
    {url: 'https://b.example.com', marker: 'embed-b', html: '<blockquote class="embed-b">B content</blockquote>'},
];

/** EmbedInput resolves a URL through iframe.ly over JSONP and loads its embed.js; both are stubbed. */
async function stubIframely(page: Page): Promise<void> {
    await page.route(/cdn\.iframe\.ly\/embed\.js/, (route) => route.fulfill({
        contentType: 'application/javascript',
        body: 'window.iframely=window.iframely||{};window.iframely.widgets={load:function(){}};',
    }));

    await page.route(/iframe\.ly\/api\/oembed/, async (route) => {
        const requestUrl = new URL(route.request().url());
        const callback = requestUrl.searchParams.get('callback') ?? 'callback';
        const resolvedUrl = requestUrl.searchParams.get('url');
        const data = {
            html: EMBEDS.find((embed) => embed.url === resolvedUrl)?.html ?? '',
            title: 'stub',
            description: '',
            url: resolvedUrl,
            type: 'link',
        };

        await route.fulfill({
            contentType: 'application/javascript',
            body: `${callback}(${JSON.stringify(data)})`,
        });
    });
}

async function openArticle(page: Page): Promise<Locator> {
    const body = (await openArticleFromList(page, ARTICLE)).fieldContainer('body_html');

    await expect(body.getByRole('textbox').first()).toBeVisible();

    return body;
}

function goToSports(page: Page): Promise<void> {
    return new Monitoring(page).openMonitoringForDesk('Sports');
}

function embedWithMarker(body: Locator, marker: string): Locator {
    return body.getByTestId('embed-block').filter({has: body.page().locator(`iframe[srcdoc*="${marker}"]`)});
}

/**
 * The embed block re-renders often, so its hover-revealed controls rarely pass `click()`'s
 * visible+stable check. Their handler is onMouseDown, which a dispatched event reaches.
 */
function pressEmbedControl(embed: Locator, control: 'embed-block-edit' | 'embed-block-remove'): Promise<void> {
    return embed.getByTestId(control).dispatchEvent('mousedown');
}

test.describe('embeds in the body (authoring-react)', () => {
    test('an embed added from the toolbar renders in the body and survives save and reopen', {
        annotation: [{type: 'confluence', description: '1308524917 complete'}], // Add embed
    }, async ({page}) => {
        await restoreDatabaseSnapshot();
        await stubIframely(page);
        await goToSports(page);

        const body = await openArticle(page);

        await expect(body.getByTestId('embed-block')).toHaveCount(0);

        await addEditor3Embed(body, EMBEDS[0].url);

        await expect(embedWithMarker(body, EMBEDS[0].marker)).toHaveCount(1);

        const {response} = await new AuthoringReact(page).saveAndGetRequest();

        expect(response.body_html).toContain(EMBEDS[0].marker);

        await new AuthoringReact(page).close();
        await openArticle(page);

        await expect(body.getByTestId('embed-block')).toHaveCount(1);
        await expect(embedWithMarker(body, EMBEDS[0].marker)).toHaveCount(1);
    });

    test('the embed edit dialog discards on Cancel and applies on Submit, and the edit survives reopen', {
        annotation: [{type: 'confluence', description: '1327759385 complete'}], // Edit embed
    }, async ({page}) => {
        const EDITED_HTML = '<blockquote class="edited-embed">edited embed content</blockquote>';

        await restoreDatabaseSnapshot();
        await stubIframely(page);
        await goToSports(page);

        const authoring = new Authoring(page);
        const body = await openArticle(page);

        await addEditor3Embed(body, EMBEDS[0].url);
        await authoring.saveAndClose();
        await openArticle(page);

        const embed = body.getByTestId('embed-block');
        const dialogInput = page.getByTestId('modal-prompt-input');

        await embed.hover();
        await expect(embed.getByTestId('embed-block-edit')).toBeVisible();
        await expect(embed.getByTestId('embed-block-remove')).toBeVisible();

        await pressEmbedControl(embed, 'embed-block-edit');
        await expect(dialogInput).toHaveValue(EMBEDS[0].html);

        await dialogInput.fill('<blockquote class="discarded-embed">discarded edit</blockquote>');
        await page.getByTestId('modal-prompt-cancel').click();
        await expect(dialogInput).toBeHidden();
        await expect(embedWithMarker(body, EMBEDS[0].marker)).toHaveCount(1);

        await pressEmbedControl(embed, 'embed-block-edit');
        await expect(dialogInput).toHaveValue(EMBEDS[0].html);

        await dialogInput.fill(EDITED_HTML);
        await page.getByTestId('modal-prompt-submit').click();
        await expect(dialogInput).toBeHidden();

        // EmbedBlock keeps rendering the old iframe until the article is reopened, in angular too
        await pressEmbedControl(embed, 'embed-block-edit');
        await expect(dialogInput).toHaveValue(EDITED_HTML);
        await page.getByTestId('modal-prompt-cancel').click();
        await expect(dialogInput).toBeHidden();

        await authoring.saveAndClose();
        await openArticle(page);

        await expect(embedWithMarker(body, 'edited-embed')).toHaveCount(1);
        await pressEmbedControl(body.getByTestId('embed-block'), 'embed-block-edit');
        await expect(dialogInput).toHaveValue(EDITED_HTML);
    });

    test('removing one of two embeds deletes only it, and the removal survives reopen', {
        annotation: [{type: 'confluence', description: '1327759390 complete'}], // Remove embed
    }, async ({page}) => {
        await restoreDatabaseSnapshot();
        await stubIframely(page);
        await goToSports(page);

        const authoring = new AuthoringReact(page);
        const body = await openArticle(page);
        const embedBlocks = body.getByTestId('embed-block');

        for (const embed of EMBEDS) {
            await addEditor3Embed(body, embed.url);
        }

        await expect(embedBlocks).toHaveCount(2);

        const removed = embedWithMarker(body, EMBEDS[0].marker);

        await removed.hover();
        await expect(removed.getByTestId('embed-block-remove')).toBeVisible();
        await pressEmbedControl(removed, 'embed-block-remove');

        await expect(embedBlocks).toHaveCount(1);
        await expect(embedWithMarker(body, EMBEDS[1].marker)).toHaveCount(1);

        await authoring.saveAndClose();
        await openArticle(page);

        await expect(embedBlocks).toHaveCount(1);
        await expect(embedWithMarker(body, EMBEDS[0].marker)).toHaveCount(0);
        await expect(embedWithMarker(body, EMBEDS[1].marker)).toHaveCount(1);
    });
});

test.describe('tables in the body (authoring-react)', () => {
    test('a table added from the toolbar takes typed cell text, and the table survives save and reopen', {
        annotation: [
            // Partial: the case's cell navigation and row/column actions are not driven.
            {type: 'confluence', description: '1308524921 partial'}, // Add table
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'editor3-tables'});
        await goToSports(page);

        const authoring = new AuthoringReact(page);
        const body = await openArticle(page);
        const table = body.getByTestId('table-block');
        const firstCell = table.locator('[contenteditable]').first();

        await expect(table).toHaveCount(0);

        await body.getByTestId('toolbar').getByRole('button', {name: 'table'}).click();
        await expect(table).toHaveCount(1);

        await firstCell.pressSequentially('cell text', {delay: 50});
        await expect(firstCell).toHaveText('cell text');

        const {response} = await authoring.saveAndGetRequest();

        expect(response.body_html).toMatch(/<table>[\s\S]*cell text[\s\S]*<\/table>/);

        await authoring.close();
        await openArticle(page);

        await expect(table).toHaveCount(1);
        await expect(firstCell).toHaveText('cell text');
    });
});
