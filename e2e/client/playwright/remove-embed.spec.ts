import {test, expect, type Locator, type Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {addEditor3Embed} from './utils/editor3';

/**
 * QA case "Remove embed" (SDESK-4441).
 *
 * The article snapshots ship without embeds, so the precondition is built in-test
 * with addEditor3Embed. Two embeds are added (not more) because the add-embed flow
 * is only reliable for a couple of sequential adds; two is enough to show that
 * removing one leaves the other untouched.
 */
test.describe('removing an embed from the article body', () => {
    // Self-contained HTML so each embed iframe renders instantly. Avoid an
    // "iframe.ly" src: EmbedBlock.componentDidMount calls loadIframely() for
    // those, and the external load keeps re-rendering the block, which detaches
    // the hover toolbar mid-interaction and makes the test flaky. The per-embed
    // class is a stable marker that survives the body_html save/reopen round-trip.
    const EMBEDS = [
        {url: 'https://a.example.com', marker: 'embed-a', html: '<blockquote class="embed-a">A content</blockquote>'},
        {url: 'https://b.example.com', marker: 'embed-b', html: '<blockquote class="embed-b">B content</blockquote>'},
    ];

    // EmbedInput resolves a URL through iframe.ly via JSONP. Intercept that call
    // and return canned oEmbed html keyed by the requested URL, so each embed
    // gets distinct, identifiable content without a third-party network call.
    async function stubIframely(page: Page): Promise<void> {
        // EmbedInput loads cdn.iframe.ly/embed.js when the add-embed popup opens.
        // Stub it with a no-op so the test stays offline and does not wait on a
        // third-party script.
        await page.route(/cdn\.iframe\.ly\/embed\.js/, async (route) => {
            await route.fulfill({
                contentType: 'application/javascript',
                body: 'window.iframely=window.iframely||{};window.iframely.widgets={load:function(){}};',
            });
        });

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

    async function markerOf(embedBlock: Locator): Promise<string> {
        const srcdoc = await embedBlock.locator('iframe').getAttribute('srcdoc') ?? '';

        return EMBEDS.find((embed) => srcdoc.includes(embed.marker))!.marker;
    }

    test('removing one embed deletes only it and preserves the other across reopen', {
        annotation: [
            {type: 'confluence', description: '1327759390 complete'}, // Remove embed (AUTOMATED)
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();
        await stubIframely(page);

        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.getArticleLocator('test sports story').dblclick();

        // Value-matched test ids (data-test-value) are more verbose natively than
        // with the legacy s() helper; .and() narrows the data-test-id to the value.
        const body = page.getByTestId('authoring')
            .getByTestId('authoring-field')
            .and(page.locator('[data-test-value="body_html"]'));

        for (const embed of EMBEDS) {
            await addEditor3Embed(body, embed.url);
        }

        const embedBlocks = body.getByTestId('embed-block');

        await expect(embedBlocks).toHaveCount(2);

        // Read the actual rendered order rather than assuming insertion direction,
        // then remove the first block. The second is the one whose content and
        // presence must survive the removal.
        const removedMarker = await markerOf(embedBlocks.nth(0));
        const survivingMarker = await markerOf(embedBlocks.nth(1));
        const removedEmbed = embedBlocks.nth(0);

        await removedEmbed.hover();
        await expect(removedEmbed.getByTestId('embed-block-remove')).toBeVisible();
        await expect(removedEmbed.getByTestId('embed-block-edit')).toBeVisible();

        // The remove control's handler is onMouseDown and the atomic embed block
        // re-renders often, so a plain click() flakes on the visible+stable check.
        // Dispatching mousedown only needs the element attached.
        await removedEmbed.getByTestId('embed-block-remove').dispatchEvent('mousedown');

        await expect(embedBlocks).toHaveCount(1);
        await expect(body.locator(`iframe[srcdoc*="${removedMarker}"]`)).toHaveCount(0);
        await expect(embedBlocks.nth(0).locator('iframe')).toHaveAttribute('srcdoc', new RegExp(survivingMarker));

        // The editor commits the removal to the article model asynchronously, so
        // closing raises the "Save changes?" prompt; choosing Save persists it.
        // The prompt's Save is scoped to its dialog so it does not collide with the
        // topbar Save button.
        await page.getByTestId('authoring-topbar').getByTestId('close').click();

        const unsavedChangesPrompt = page.getByTestId('unsaved-changes-dialog');

        await unsavedChangesPrompt.getByRole('button', {name: 'Save', exact: true}).click();

        // Wait for the article to fully close before reopening; otherwise the
        // reopen races the closing authoring view.
        await expect(page.getByTestId('authoring-topbar')).toBeHidden();

        await monitoring.getArticleLocator('test sports story').dblclick();

        const reopenedEmbeds = body.getByTestId('embed-block');

        await expect(reopenedEmbeds).toHaveCount(1);
        await expect(body.locator(`iframe[srcdoc*="${removedMarker}"]`)).toHaveCount(0);
        await expect(reopenedEmbeds.nth(0).locator('iframe')).toHaveAttribute('srcdoc', new RegExp(survivingMarker));
    });
});
