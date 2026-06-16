import {test, expect, type Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';

/**
 * QA case "Edit embed" (SDESK-4441 / SDESK-4213).
 *
 * An embed in the article Body can be edited through its hover toolbar, and the
 * edit is preserved after the article is saved and reopened.
 *
 * The article snapshots ship without embeds, so the precondition ("article with
 * embed objects in the Body field") is created in-test through the add-embed
 * flow before the edit behaviour under test is exercised.
 */
test.describe('editing an embed in the article body', () => {
    const ORIGINAL_EMBED_URL = 'https://sourcefabric.org';
    // Self-contained HTML so the embed iframe renders instantly. Avoid an
    // "iframe.ly" src: EmbedBlock.componentDidMount calls loadIframely() for
    // those, and the external load keeps re-rendering the block, which detaches
    // the hover toolbar mid-interaction and makes the test flaky.
    const ORIGINAL_EMBED_HTML = '<blockquote class="original-embed">original embed content</blockquote>';
    const EDITED_EMBED_HTML = '<blockquote class="edited-embed">edited embed content</blockquote>';

    // EmbedInput resolves a URL through iframe.ly via JSONP. Intercept that call
    // and return canned oEmbed html so the test does not depend on a third-party
    // network service.
    async function stubIframely(page: Page): Promise<void> {
        await page.route(/iframe\.ly\/api\/oembed/, async (route) => {
            const callback = new URL(route.request().url()).searchParams.get('callback') ?? 'callback';
            const data = {
                html: ORIGINAL_EMBED_HTML,
                title: 'Sourcefabric',
                description: 'Open source tools for news media.',
                url: ORIGINAL_EMBED_URL,
                type: 'link',
            };

            await route.fulfill({
                contentType: 'application/javascript',
                body: `${callback}(${JSON.stringify(data)})`,
            });
        });
    }

    test('hover controls open the edit dialog; Cancel discards, Submit persists across reopen', async ({page}) => {
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

        await page.getByTestId('toolbar').getByRole('button', {name: 'Embed'}).click();
        // The embed URL field is uncontrolled (read by ref on submit), so confirm
        // the value landed before clicking submit; otherwise submit can fire first
        // and create an embed with empty html.
        const embedUrlInput = page.getByTestId('embed-form').getByRole('textbox');

        await embedUrlInput.fill(ORIGINAL_EMBED_URL);
        await expect(embedUrlInput).toHaveValue(ORIGINAL_EMBED_URL);
        await page.getByTestId('embed-controls').getByTestId('submit').click();

        const embed = body.getByTestId('embed-block');

        await expect(embed).toBeVisible();

        await embed.hover();
        await expect(embed.getByTestId('embed-block-edit')).toBeVisible();
        await expect(embed.getByTestId('embed-block-remove')).toBeVisible();

        // The atomic embed block re-renders frequently, so the hover-revealed Edit
        // control rarely satisfies click()'s visible+stable check at the same
        // instant. Its handler is onMouseDown, so dispatch that directly; it waits
        // only for the element to be attached, not visible or stable.
        await embed.getByTestId('embed-block-edit').dispatchEvent('mousedown');

        const dialogInput = page.getByTestId('modal-prompt-input');

        await expect(dialogInput).toBeVisible();
        await expect(dialogInput).toHaveValue(ORIGINAL_EMBED_HTML);

        await dialogInput.fill('<blockquote class="discarded-embed">discarded edit</blockquote>');
        await page.getByTestId('modal-prompt-cancel').click();
        await expect(dialogInput).toBeHidden();

        await embed.getByTestId('embed-block-edit').dispatchEvent('mousedown');
        await expect(dialogInput).toHaveValue(ORIGINAL_EMBED_HTML);

        await dialogInput.fill(EDITED_EMBED_HTML);
        await page.getByTestId('modal-prompt-submit').click();
        await expect(dialogInput).toBeHidden();

        // The editor commits the embed change to the article model asynchronously,
        // so closing raises the "Save changes?" prompt; choosing Save persists the
        // change and closes the article. The prompt's Save is scoped to its dialog
        // so it does not collide with the topbar Save button.
        await page.getByTestId('authoring-topbar').getByTestId('close').click();

        const unsavedChangesPrompt = page.getByTestId('unsaved-changes-dialog');

        await unsavedChangesPrompt.getByRole('button', {name: 'Save', exact: true}).click();

        // Wait for the article to fully close before reopening; otherwise the
        // reopen races the closing authoring view.
        await expect(page.getByTestId('authoring-topbar')).toBeHidden();

        await monitoring.getArticleLocator('test sports story').dblclick();

        const reopenedEmbed = body.getByTestId('embed-block');

        await expect(reopenedEmbed).toBeVisible();
        await reopenedEmbed.getByTestId('embed-block-edit').dispatchEvent('mousedown');
        await expect(page.getByTestId('modal-prompt-input')).toHaveValue(EDITED_EMBED_HTML);
    });
});
