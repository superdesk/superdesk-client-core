import {Locator, Page, expect} from '@playwright/test';
import {s} from '.';

/**
 * Class editor3 puts on a toolbar button whose style is active for the current
 * selection. Matched as a pattern because the class is hashed by CSS modules.
 */
export const EDITOR3_ACTIVE_BUTTON = /Editor3-activeButton/;

/**
 * The editor3 authoring field for `fieldId` (`body_html`, `abstract`, ...). The field
 * id rides in `data-test-value`, not in a test id, so it cannot be reached by chaining
 * `getByTestId` alone.
 */
export function getEditor3Field(page: Page, fieldId: string): Locator {
    return page.getByTestId('authoring')
        .getByTestId('authoring-field')
        .and(page.locator(`[data-test-value="${fieldId}"]`));
}

/**
 * A toolbar button of the editor3 `field`, addressed by the Superdesk formatting-option
 * id `StyleButton` puts in `data-test-value` (`bold`, `h2`, `quote`, ...). That id is not
 * the tag the block ends up rendered as: `quote` renders `blockquote` and `pre` comes
 * from the `code-block` option (see `blockStyles` in
 * scripts/core/editor3/components/toolbar/BlockStyleButtons.tsx).
 */
export function getEditor3FormattingOptionButton(field: Locator, option: string): Locator {
    return field.getByTestId('toolbar')
        .getByTestId('formatting-option-button')
        .and(field.page().locator(`[data-test-value="${option}"]`));
}

/**
 * Presses `key` `times` times. Editor3 specs move and extend the selection with counted
 * arrow presses because Home/End do not move the caret on macOS.
 */
export async function pressRepeatedly(page: Page, key: string, times: number): Promise<void> {
    for (let i = 0; i < times; i++) {
        await page.keyboard.press(key);
    }
}

export function getEditor3Paragraphs(field: Locator): Promise<Array<string>> {
    return field.locator('.DraftEditor-root')
        .first() // there might be multiple roots when working with nested blocks e.g. multi-line-quote
        .locator('[data-contents="true"]')
        .first() // there might be multiple [data-contents] when working with nested blocks e.g. multi-line-quote
        .locator('> *')
        .allInnerTexts()
        .then((items) => items.filter((text) => text.trim().length > 0));
}

export async function getEditor3FormattingOptions(field: Locator): Promise<Array<string>> {
    const locators = await field.locator(s('toolbar', 'formatting-option')).all();

    const result: Array<string> = [];

    for (const locator of locators) {
        const val = await locator.getAttribute('data-test-value');

        if (val != null) {
            result.push(val);
        }
    }

    return result;
}

/**
 * Adds an embed to an editor3 field through the add-embed flow (toolbar Embed >
 * enter URL > submit) and waits for its layout to settle (the iframe onLoad height
 * applied), so a following interaction is not churned by the reflow.
 *
 * `field` is the editor3 field locator (e.g. the body_html authoring-field). The
 * URL is resolved through iframe.ly, so a test that calls this must stub that
 * network (see remove-embed.spec.ts / edit-embed.spec.ts).
 *
 * The flow is fiddly enough to need a single hardened implementation:
 * - EmbedInput's URL field is uncontrolled (read by ref on submit) and the popup
 *   can re-render right after it opens, dropping the typed value. Filling and
 *   verifying as a retried unit re-fills if the value did not stick. Submitting an
 *   empty ref injects a malformed embed that crashes the editor, so the value must
 *   be present before submit.
 * - A new embed renders before its iframe onLoad sets the height (EmbedBlock sets
 *   iframe.height = scrollHeight), and that height change reflows the editor.
 *   Waiting for every embed's iframe to carry a height attribute defers the caller
 *   (e.g. a second add) until that reflow has happened.
 */
export async function addEditor3Embed(field: Locator, url: string): Promise<void> {
    const page = field.page();
    const embedBlocks = field.getByTestId('embed-block');
    const countBefore = await embedBlocks.count();

    await field.getByTestId('toolbar').getByRole('button', {name: 'Embed'}).click();

    const embedForm = page.getByTestId('embed-form');
    const urlInput = embedForm.getByRole('textbox');

    await expect(async () => {
        await urlInput.fill(url);
        await expect(urlInput).toHaveValue(url);
    }).toPass();

    await page.getByTestId('embed-controls').getByTestId('submit').click();
    await expect(embedForm).toBeHidden();

    await expect(embedBlocks).toHaveCount(countBefore + 1);
    await expect(embedBlocks.locator('iframe[height]')).toHaveCount(countBefore + 1);
}

export async function setEditor3FieldValue(locator: Locator, value: string) {
    for (let i = 0; i < 10; i++) {
        await locator.clear();
        await locator.fill(value);

        const currentInputValue = await locator.innerText();

        if (currentInputValue === value) return;
    }

    throw new Error(`Failed to fill input with "${value}" after 10 attempts.`);
}
