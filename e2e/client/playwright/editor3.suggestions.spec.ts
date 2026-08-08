import {test, expect, type Locator, type Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {pressRepeatedly, restoreDatabaseSnapshot} from './utils';
import {
    EDITOR3_ACTIVE_BUTTON,
    getEditor3Field,
    getEditor3FormattingButton,
    getEditor3TextRun,
} from './utils/editor3';

/**
 * The suggestions-mode QA cases: making suggestions, and accepting or rejecting them.
 *
 * "Use suggestions mode" (1308524939) and "Toggle Suggestions Mode button" (1313669232) are
 * two page ids carrying the same document, down to the steps and the expected results, so
 * they are one test with both annotations rather than two copies.
 *
 * Every test restores the `editor3-suggestions` snapshot, which is the only one that offers
 * the `suggestions` option at all: neither `main` nor `editor3-formats` enables it on any
 * field, and every case's prerequisite asks for a profile that has it on the body plus a
 * custom text field.
 *
 * The accept and reject cases start from "an article with existing suggestions", which the
 * snapshot carries as "story with suggestions": suggestions live in `fields_meta` as draft.js
 * editor state, and a record captures whatever the browser writes to mongo, so they survive a
 * restore like any other field.
 *
 * Only the toggle case drives the custom text field ("Sample rich text"). The accept and
 * reject cases name it in their prerequisites but their steps and expected results speak of
 * the Body field alone.
 */

// Three tests, each driving one or two full save/close/reopen round-trips, which does not fit
// the default per-test budget. The budget is well clear of the assertion timeouts inside those
// steps, so a slow step fails on its own assertion rather than as a generic test timeout.
test.setTimeout(150000);

test.describe('editor3 suggestions mode', () => {
    const SNAPSHOT = {snapshotName: 'editor3-suggestions'};

    // The Angular authoring view keys custom fields by display name, not vocabulary id.
    const CUSTOM_FIELD = 'Sample rich text';
    const CUSTOM_TEXT = 'golf';

    /** Absolute date the popup renders, `moment`'s "MMMM Do YYYY, h:mm:ss a". */
    const POPUP_DATE = /^[A-Z][a-z]+ \d{1,2}(st|nd|rd|th) \d{4}, \d{1,2}:\d{2}:\d{2} (am|pm)$/;

    type ISuggestionKind = 'add' | 'delete' | 'plain';

    interface ISuggestionColours {
        adding: string;
        addingBg: string;
        removing: string;
        removingBg: string;
    }

    interface IRun {
        text: string;
        kind: ISuggestionKind;
    }

    /**
     * Resolves the four suggestion colour tokens to the form a computed style reports, by
     * painting a probe element with each and letting the browser convert. They are design
     * tokens declared in superdesk-ui-framework, so a literal in the spec would be a manual
     * conversion that a token change turns into an opaque colour mismatch.
     *
     * The probe goes inside the editor3 field because the tokens are redeclared per editor
     * theme (`.sd-editor--theme-default`, `.sd-editor--theme-dark`), so resolving them
     * anywhere else can produce a different colour than the one the field is painted with.
     */
    function getSuggestionColours(field: Locator): Promise<ISuggestionColours> {
        return field.evaluate((fieldElement) => {
            const probe = document.createElement('span');

            fieldElement.appendChild(probe);

            const colour = (token: string) => {
                probe.style.color = `var(${token})`;

                return window.getComputedStyle(probe).color;
            };
            const background = (token: string) => {
                probe.style.backgroundColor = `var(${token})`;

                return window.getComputedStyle(probe).backgroundColor;
            };

            const result = {
                adding: colour('--sd-editor-colour__adding'),
                removing: colour('--sd-editor-colour__removing'),
                addingBg: background('--sd-editor-colour__adding-bg'),
                removingBg: background('--sd-editor-colour__removing-bg'),
            };

            probe.remove();

            return result;
        });
    }

    /**
     * Reads the field's draft.js leaves as a left-to-right list of `{text, kind}`, which is
     * the whole body state in one value: what the text says, which stretches of it are
     * suggestions, and where those sit relative to the rest.
     *
     * A leaf is one run of equally styled characters, and draft applies the suggestion
     * colours to the leaf element, so the kind is read off the computed colour rather than
     * off a class or a style attribute (the highlight style names are generated per
     * suggestion and carry no stable hook).
     */
    function getSuggestionRuns(field: Locator, colours: ISuggestionColours): Promise<Array<IRun>> {
        return field.locator('[data-offset-key]:has(> [data-text="true"])')
            .evaluateAll((nodes, c: ISuggestionColours) => nodes.map((node) => {
                const {color} = window.getComputedStyle(node);

                return {
                    text: node.textContent ?? '',
                    kind: color === c.adding ? 'add' : color === c.removing ? 'delete' : 'plain',
                };
            }), colours);
    }

    function expectRuns(field: Locator, colours: ISuggestionColours, runs: Array<IRun>): Promise<void> {
        return expect.poll(() => getSuggestionRuns(field, colours)).toEqual(runs);
    }

    function getHeadlineField(page: Page): Locator {
        return page.getByTestId('field--headline').getByRole('textbox');
    }

    /**
     * Creates an article with `headline` on the Sports desk from the default template.
     *
     * A restore lands in the search index asynchronously, so a rerun of the same test can
     * still be served the article the previous run created, and would then edit that one
     * instead of a fresh article. Waiting for a fixture item to be listed and for the
     * headline to be absent gates on the restore being visible.
     */
    async function createArticle(page: Page, headline: string): Promise<void> {
        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await expect(monitoring.getArticleLocator('test sports story')).toBeVisible();
        await expect(monitoring.getArticleLocator(headline)).toHaveCount(0);

        await monitoring.createArticleFromDefaultTemplate();

        const headlineField = getHeadlineField(page);

        await expect(headlineField).toBeVisible();
        await headlineField.fill(headline);
        await expect(headlineField).toHaveText(headline);
    }

    /**
     * Opens a suggestion's detail popup by clicking its text run, and asserts every part the
     * accept and reject cases list on it: the author's avatar and name, the date, the
     * description, and the two resolution buttons. The popup is left open.
     *
     * The caret is parked on `caretPark` (a run that is not a suggestion) before every
     * attempt, because `HighlightsPopup` re-renders only when the caret moves: a click that
     * lands where the caret already sits, which is where accepting or rejecting leaves it,
     * would show nothing.
     *
     * The clicks and the assertions are retried as one unit rather than the clicks alone,
     * because the popup is torn down on any re-render that moves the caret: a single click
     * does not always leave the caret inside the run, and one that did can still be undone
     * while the assertions that follow it are running.
     */
    async function expectSuggestionDetail(field: Locator, options: {
        text: string;
        caretPark: string;
        description: string;
    }): Promise<void> {
        const page = field.page();
        const timeout = 3000;

        await expect(async () => {
            await getEditor3TextRun(field, options.caretPark).click();
            await getEditor3TextRun(field, options.text).click();

            await expect(page.getByTestId('suggestion-header').getByTestId('user-avatar')).toBeVisible({timeout});
            await expect(page.getByTestId('suggestion-author')).toHaveText('John Doe', {timeout});
            await expect(page.getByTestId('suggestion-date')).toHaveText(POPUP_DATE, {timeout});
            await expect(page.getByTestId('suggestion-text')).toHaveText(options.description, {timeout});
            await expect(page.getByTestId('suggestion-accept')).toBeVisible({timeout});
            await expect(page.getByTestId('suggestion-reject')).toBeVisible({timeout});
        }).toPass({timeout: 30000});
    }

    /** Resolves the open suggestion detail, which closes it. */
    async function actOnSuggestion(page: Page, action: 'accept' | 'reject'): Promise<void> {
        await page.getByTestId(`suggestion-${action}`).click();
        await expect(page.getByTestId('suggestion-text')).toHaveCount(0);
    }

    /**
     * The article the snapshot carries with suggestions already in its body, and the words its
     * body is made of: `alpha [bravo] charlie <delta> echo [foxtrot]`, where `[...]` is an
     * insertion suggestion and `<...>` a deletion suggestion.
     *
     * Words rather than letters, so a run stays wide enough to click reliably and so
     * `getEditor3TextRun`'s substring match cannot pick the wrong leaf.
     *
     * Every suggestion is separated from the next by plain text on purpose. An insertion
     * directly next to a deletion is reported as one "Replace" suggestion and is accepted or
     * rejected as a unit, which is a different case from the two these cases resolve.
     *
     * `foxtrot` is the suggestion no test touches, so that the reopened article still has one
     * to preserve after the other two have been resolved.
     */
    const SEEDED_HEADLINE = 'story with suggestions';
    const PLAIN_HEAD = 'alpha';
    const INSERTED = 'bravo';
    const PLAIN_MIDDLE = 'charlie';
    const DELETED = 'delta';
    const PLAIN_TAIL = 'echo';
    const UNTOUCHED = 'foxtrot';

    const SEEDED_RUNS: Array<IRun> = [
        {text: PLAIN_HEAD, kind: 'plain'},
        {text: INSERTED, kind: 'add'},
        {text: PLAIN_MIDDLE, kind: 'plain'},
        {text: DELETED, kind: 'delete'},
        {text: PLAIN_TAIL, kind: 'plain'},
        {text: UNTOUCHED, kind: 'add'},
    ];

    /** Opens `story with suggestions` from Sports monitoring and returns its Body field. */
    async function openSeededArticle(page: Page): Promise<Locator> {
        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.getArticleLocator(SEEDED_HEADLINE).dblclick();
        await expect(getHeadlineField(page)).toHaveText(SEEDED_HEADLINE);

        const body = getEditor3Field(page, 'body_html');

        await expect(body.getByRole('textbox')).toBeVisible();

        return body;
    }

    /** Saves and closes the open article, then reopens it from monitoring. */
    async function saveAndReopen(page: Page, headline: string): Promise<void> {
        const monitoring = new Monitoring(page);

        await new Authoring(page).closeAndSave();
        await monitoring.getArticleLocator(headline).dblclick();
        await expect(getHeadlineField(page)).toHaveText(headline);
    }

    test('suggestions mode marks inserted text green and deleted text struck through', {
        annotation: [
            {type: 'confluence', description: '1308524939 complete'}, // Use suggestions mode
            {type: 'confluence', description: '1313669232 complete'}, // Toggle Suggestions Mode button
        ],
    }, async ({page}) => {
        const headline = 'suggestions mode test';
        const SUGGESTED = 'hotel';
        const REGULAR = 'india';
        const REMOVED = 'juliett';

        await restoreDatabaseSnapshot(SNAPSHOT);
        await createArticle(page, headline);

        const body = getEditor3Field(page, 'body_html');
        const bodyInput = body.getByRole('textbox');
        const toggle = getEditor3FormattingButton(body, 'suggestions');
        const colours = await getSuggestionColours(body);

        await expect(bodyInput).toBeVisible();
        await bodyInput.click();

        await expect(toggle).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await toggle.click();
        await expect(toggle).toHaveClass(EDITOR3_ACTIVE_BUTTON);

        await page.keyboard.type(SUGGESTED);

        const suggestedRun = getEditor3TextRun(body, SUGGESTED);

        await expect(suggestedRun).toHaveCSS('color', colours.adding);
        await expect(suggestedRun).toHaveCSS('background-color', colours.addingBg);

        await toggle.click();
        await expect(toggle).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);

        await page.keyboard.type(REGULAR + REMOVED);
        await expectRuns(body, colours, [
            {text: SUGGESTED, kind: 'add'},
            {text: REGULAR + REMOVED, kind: 'plain'},
        ]);

        await toggle.click();
        await expect(toggle).toHaveClass(EDITOR3_ACTIVE_BUTTON);

        // The caret sits at the end of the plain text; select its second half and delete it.
        // Only the half away from the insertion, so the two stay separate suggestions rather
        // than being reported as one "Replace".
        await pressRepeatedly(page, 'Shift+ArrowLeft', REMOVED.length);
        await page.keyboard.press('Backspace');

        const removedRun = getEditor3TextRun(body, REMOVED);

        await expect(removedRun).toHaveCSS('color', colours.removing);
        await expect(removedRun).toHaveCSS('background-color', colours.removingBg);
        await expect(removedRun).toHaveCSS('text-decoration-line', 'line-through');

        const afterEditing: Array<IRun> = [
            {text: SUGGESTED, kind: 'add'},
            {text: REGULAR, kind: 'plain'},
            {text: REMOVED, kind: 'delete'},
        ];

        await expectRuns(body, colours, afterEditing);

        await expectSuggestionDetail(body, {
            text: SUGGESTED,
            caretPark: REGULAR,
            description: `Add: ${SUGGESTED}`,
        });

        await getEditor3TextRun(body, REGULAR).click();
        await expect(page.getByTestId('suggestion-text')).toHaveCount(0);

        await saveAndReopen(page, headline);

        await expect(bodyInput).toBeVisible();
        await expectRuns(body, colours, afterEditing);

        const custom = getEditor3Field(page, CUSTOM_FIELD);
        const customInput = custom.getByRole('textbox');
        const customToggle = getEditor3FormattingButton(custom, 'suggestions');

        await expect(customInput).toBeVisible();
        await customInput.click();

        await expect(customToggle).not.toHaveClass(EDITOR3_ACTIVE_BUTTON);
        await customToggle.click();
        await expect(customToggle).toHaveClass(EDITOR3_ACTIVE_BUTTON);

        await page.keyboard.type(CUSTOM_TEXT);
        await expectRuns(custom, colours, [{text: CUSTOM_TEXT, kind: 'add'}]);

        await saveAndReopen(page, headline);

        await expect(customInput).toBeVisible();
        await expectRuns(custom, colours, [{text: CUSTOM_TEXT, kind: 'add'}]);
        await expectRuns(body, colours, afterEditing);
    });

    test('accepting a suggestion applies the insertion and carries out the deletion', {
        annotation: [
            {type: 'confluence', description: '1313669234 complete'}, // Accept suggestion
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot(SNAPSHOT);

        const body = await openSeededArticle(page);
        const bodyInput = body.getByRole('textbox');
        const colours = await getSuggestionColours(body);

        await expectRuns(body, colours, SEEDED_RUNS);

        await expectSuggestionDetail(body, {
            text: INSERTED,
            caretPark: PLAIN_HEAD,
            description: `Add: ${INSERTED}`,
        });
        await actOnSuggestion(page, 'accept');

        // The accepted insertion is plain text now, so it and the plain runs around it are
        // one run of equally styled characters.
        const afterAcceptingInsertion: Array<IRun> = [
            {text: PLAIN_HEAD + INSERTED + PLAIN_MIDDLE, kind: 'plain'},
            {text: DELETED, kind: 'delete'},
            {text: PLAIN_TAIL, kind: 'plain'},
            {text: UNTOUCHED, kind: 'add'},
        ];

        await expectRuns(body, colours, afterAcceptingInsertion);

        await expectSuggestionDetail(body, {
            text: DELETED,
            caretPark: PLAIN_HEAD,
            description: `Remove: ${DELETED}`,
        });
        await actOnSuggestion(page, 'accept');

        const afterAcceptingDeletion: Array<IRun> = [
            {text: PLAIN_HEAD + INSERTED + PLAIN_MIDDLE + PLAIN_TAIL, kind: 'plain'},
            {text: UNTOUCHED, kind: 'add'},
        ];

        await expectRuns(body, colours, afterAcceptingDeletion);

        await saveAndReopen(page, SEEDED_HEADLINE);

        await expect(bodyInput).toBeVisible();
        await expectRuns(body, colours, afterAcceptingDeletion);
    });

    test('rejecting a suggestion drops the insertion and keeps the deleted text', {
        annotation: [
            {type: 'confluence', description: '1313669236 complete'}, // Reject suggestion
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot(SNAPSHOT);

        const body = await openSeededArticle(page);
        const bodyInput = body.getByRole('textbox');
        const colours = await getSuggestionColours(body);

        await expectRuns(body, colours, SEEDED_RUNS);

        await expectSuggestionDetail(body, {
            text: INSERTED,
            caretPark: PLAIN_HEAD,
            description: `Add: ${INSERTED}`,
        });
        await actOnSuggestion(page, 'reject');

        const afterRejectingInsertion: Array<IRun> = [
            {text: PLAIN_HEAD + PLAIN_MIDDLE, kind: 'plain'},
            {text: DELETED, kind: 'delete'},
            {text: PLAIN_TAIL, kind: 'plain'},
            {text: UNTOUCHED, kind: 'add'},
        ];

        await expectRuns(body, colours, afterRejectingInsertion);

        await expectSuggestionDetail(body, {
            text: DELETED,
            caretPark: PLAIN_HEAD,
            description: `Remove: ${DELETED}`,
        });
        await actOnSuggestion(page, 'reject');

        const afterRejectingDeletion: Array<IRun> = [
            {text: PLAIN_HEAD + PLAIN_MIDDLE + DELETED + PLAIN_TAIL, kind: 'plain'},
            {text: UNTOUCHED, kind: 'add'},
        ];

        await expectRuns(body, colours, afterRejectingDeletion);

        await saveAndReopen(page, SEEDED_HEADLINE);

        await expect(bodyInput).toBeVisible();
        await expectRuns(body, colours, afterRejectingDeletion);
    });
});
