import {Locator, Page, expect, test} from '@playwright/test';
import {AuthoringReact} from './page-object-models/authoring-react';
import {Monitoring} from './page-object-models/monitoring';
import {ContentProfileSettings} from './page-object-models/settings/content-profile';
import {getUnreadNotificationsBadge, newSession, restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';
import {
    clickInPopup,
    getEditor3Field,
    getEditor3SelectionButton,
    getEditor3TextRun,
    mentionUser,
    selectEditor3TrailingText,
    typeIntoEditor3Field,
} from './utils/editor3';
import {createArticle, saveCloseAndReopen} from './scenarios/authoring-react-article';

/**
 * Editor3 inline comments in authoring-react: adding, editing, deleting, replying, resolving,
 * the Inline comments widget and the notification a mentioned user receives. Runs on
 * `editor3-comments`, the only snapshot enabling the option. The comment popups are the same
 * editor3 components as in the angular editor (editor3.inline-comments.spec.ts), so their
 * handling is carried over. The Inline comments widget is authoring-react's own
 * (`generic-widgets/inline-comments.tsx`).
 */

test.use({storageState: getStorageState({}, {authoringReact: true})});

test.describe.configure({timeout: 90000});

const SNAPSHOT = 'editor3-comments';

/**
 * Body text of every article the spec creates, split in two so "select the text to
 * comment on" is a fixed number of Shift+Arrow presses and each half stays its own
 * Draft.js leaf once the comment splits the block.
 */
const PLAIN_TEXT = 'alpha';
const COMMENTED_TEXT = 'bravo';
const BODY_TEXT = `${PLAIN_TEXT} ${COMMENTED_TEXT}`;

const COMMENT_TEXT = 'first thoughts on bravo';
const EDITED_COMMENT_TEXT = 'second thoughts on bravo';
const REPLY_TEXT = 'agreed on bravo';
const EDITED_REPLY_TEXT = 'still agreed on bravo';

/** What `getComputedStyle` reports for an element with no background of its own. */
const NO_BACKGROUND = 'rgba(0, 0, 0, 0)';

/** `Comment.tsx` formats the date as `MMMM Do YYYY, h:mm:ss a`. */
const POPUP_DATE = /^[A-Z][a-z]+ \d{1,2}(st|nd|rd|th) \d{4}, \d{1,2}:\d{2}:\d{2} [ap]m$/;

function getCommentButton(body: Locator): Locator {
    return getEditor3SelectionButton(body, 'Comment');
}

/**
 * The comment detail popup. `HighlightsPopup` renders it into the global
 * `#react-placeholder`, not inside the editor, so it's looked up on the page.
 */
function getCommentPopup(page: Page): Locator {
    return page.getByTestId('comment');
}

/**
 * The colour a commented run is highlighted in. The COMMENT highlight is an inline
 * `background-color: var(--sd-editor-colour__comment-bg)` (highlightsConfig.ts); the
 * token lives on the authoring `.theme-container`, not `:root`, and holds an `hsl()`
 * value the browser reports back as `rgb()`, so it's read through a probe mounted
 * inside the field instead of being hardcoded. Fails when the token does not resolve: it
 * would read as NO_BACKGROUND and make every highlight assertion vacuous.
 */
async function getCommentHighlightColor(body: Locator): Promise<string> {
    const color = await body.evaluate((element) => {
        const probe = document.createElement('span');

        probe.style.backgroundColor = 'var(--sd-editor-colour__comment-bg)';
        element.appendChild(probe);

        const probeColor = window.getComputedStyle(probe).backgroundColor;

        probe.remove();

        return probeColor;
    });

    expect(color).not.toBe(NO_BACKGROUND);

    return color;
}

function typeBody(page: Page): Promise<Locator> {
    return typeIntoEditor3Field(page, 'body_html', BODY_TEXT);
}

function selectCommentTarget(page: Page, body: Locator): Promise<void> {
    return selectEditor3TrailingText(page, body, BODY_TEXT, COMMENTED_TEXT);
}

/**
 * The comment entry popup opened by the toolbar Comment button. Assert visibility on
 * the field inside it, never on this element: it's only a scope whose single child is
 * an absolutely positioned dropdown, so the element itself has no size.
 */
function getCommentDialog(page: Page): Locator {
    return page.getByTestId('comment-input');
}

/**
 * Adds a comment on the trailing word of the field through the toolbar Comment flow.
 * Fill, check and Submit retry as one unit: the entry popup can re-render after it
 * opens and drop the typed text even after the check saw it, leaving Submit disabled
 * (see `addEditor3Embed`).
 */
async function addComment(page: Page, body: Locator, message: string): Promise<void> {
    const dialog = getCommentDialog(page);
    const input = dialog.getByTestId('comment-textarea').getByRole('textbox');

    await selectCommentTarget(page, body);
    await expect(getCommentButton(body)).not.toHaveClass(/inactive/);
    await getCommentButton(body).click();

    await expect(input).toBeVisible();
    await expect(async () => {
        await input.fill(message);
        await expect(input).toHaveValue(message, {timeout: 1000});
        await dialog.getByTestId('submit').click({timeout: 2000});
    }).toPass({timeout: 15000});

    await expect(dialog).toHaveCount(0);
}

/**
 * Clicks the uncommented half of the body, then the commented word: the pair that
 * brings the popup up. On a freshly opened article, clicking the commented word alone
 * never opens it, however often; the caret has to land elsewhere first so the second
 * click moves it onto the highlight. Going through the uncommented half every time
 * works both there and in an article whose body was just typed.
 */
async function clickCommentedText(body: Locator): Promise<void> {
    await getEditor3TextRun(body, PLAIN_TEXT).click();
    await getEditor3TextRun(body, COMMENTED_TEXT).click();
}

/**
 * Opens the detail popup of the comment on the trailing word. The click pair is
 * retried because the popup can be taken down again right after it opens:
 * `HighlightsPopup` unmounts it whenever the caret it sees isn't on a highlight, and
 * the field keeps re-rendering on its own for a while after an edit.
 */
async function openCommentPopup(page: Page, body: Locator): Promise<Locator> {
    const popup = getCommentPopup(page);

    await expect(async () => {
        await clickCommentedText(body);
        await expect(popup).toBeVisible({timeout: 2000});
    }).toPass({timeout: 30000});

    return popup;
}

/**
 * Asserts the message of the comment on the trailing word, reopening the popup as
 * often as it takes. Needed on a just-reopened article, where `openCommentPopup` alone
 * isn't enough: editor3 resets its selection once more while initializing, dropping
 * the caret off the highlight and closing a popup that had already come up. Retrying
 * the open together with the assertion survives that.
 */
async function expectCommentText(page: Page, body: Locator, message: string): Promise<void> {
    const popup = getCommentPopup(page);

    await expect(async () => {
        await clickCommentedText(body);
        await expect(popup.getByTestId('comment-text')).toHaveText(message, {timeout: 2000});
    }).toPass({timeout: 30000});
}

/**
 * An entry of a comment's (or reply's) 3-dots menu, matched on text rather than
 * accessible name: each entry renders an icon before its label (`Comment.tsx`) and
 * Chrome folds the icon's glyph into the name.
 */
function getCommentAction(menu: Locator, action: string): Locator {
    return menu.getByRole('button').filter({hasText: action});
}

/** Picks an entry from the 3-dots action menu of a comment or of one of its replies. */
async function executeCommentAction(comment: Locator, action: string): Promise<void> {
    const menu = comment.getByTestId('highlight-actions-menu').first();

    await clickInPopup(comment.getByTestId('highlight-actions-toggle').first());
    await expect(menu).toBeVisible();
    await clickInPopup(getCommentAction(menu, action));
}

/**
 * Rewrites the message of a comment or reply that is already open for editing. The fill
 * is checked and retried: react-mentions can read it as an insertion and keep the old
 * message after the new one.
 */
async function submitEditedMessage(target: Locator, message: string): Promise<void> {
    const body = target.getByTestId('comment-text');
    const input = body.getByTestId('comment-textarea').getByRole('textbox');

    await expect(async () => {
        await input.fill(message);
        await expect(input).toHaveValue(message, {timeout: 1000});
    }).toPass({timeout: 15000});
    await clickInPopup(body.getByTestId('submit'));
}

/**
 * Focuses the reply field, which is what renders the Reply/Cancel toolbar under it
 * (`CommentPopup` keeps a `replyFieldFocused` flag). The blur first matters: Cancel
 * clears the flag while the field keeps DOM focus, and focusing an already-focused
 * field raises no focus event, so the toolbar would stay away.
 */
async function focusReplyField(popup: Locator, options?: {timeout?: number}): Promise<void> {
    const addReply = popup.getByTestId('add-reply');

    await addReply.getByTestId('comment-textarea').getByRole('textbox')
        .evaluate((element: HTMLElement) => element.blur(), undefined, options);
    await addReply.getByTestId('comment-textarea').getByRole('textbox').focus(options);

    await expect(addReply.getByTestId('submit')).toBeVisible(options);
}

// Retried as one unit because the entry popup can re-render and drop the typed `@Sam`.
async function mentionSamGamgee(page: Page, input: Locator): Promise<void> {
    await expect(async () => {
        await input.fill('');
        await mentionUser(page, input, '@Sam', 'Sam Gamgee', {timeout: 2000});
        await expect(input).toHaveValue('Sam Gamgee ', {timeout: 1000});
    }).toPass({timeout: 15000});
}

/**
 * Replies to the comment on the trailing word. Opening the popup when it is closed, focusing
 * and filling retry as one unit: the popup can close on its own, and its remount empties the
 * reply field. Submit stays outside the retry, which would otherwise post the reply twice.
 */
async function addReply(body: Locator, message: string): Promise<void> {
    const popup = getCommentPopup(body.page());
    const addReplyBox = popup.getByTestId('add-reply');
    const input = addReplyBox.getByTestId('comment-textarea').getByRole('textbox');

    await expect(async () => {
        if (!await popup.isVisible()) {
            await clickCommentedText(body);
        }

        await focusReplyField(popup, {timeout: 2000});
        await input.fill(message, {timeout: 2000});
        await expect(input).toHaveValue(message, {timeout: 1000});
    }).toPass({timeout: 15000});
    await clickInPopup(addReplyBox.getByTestId('submit'), {timeout: 5000});
}

// no snapshot ships an article with an inline comment
async function createArticleWithComment(page: Page, headline: string): Promise<Locator> {
    await createArticle(page, headline);

    const body = await typeBody(page);

    await addComment(page, body, COMMENT_TEXT);
    await saveCloseAndReopen(page, headline);

    return body;
}

function openCommentsWidget(page: Page): Promise<Locator> {
    return new AuthoringReact(page).openWidgetByIcon('inline-comments');
}

/** The widget's tab buttons carry their count in the label, e.g. "Unresolved (1)". */
function getWidgetTab(widget: Locator, tab: 'Unresolved' | 'Resolved'): Locator {
    return widget.getByRole('button', {name: new RegExp(`^${tab} \\(\\d+\\)$`)});
}

const SAM = {username: 'samgamgee', password: 'samgamgee'};

test('adding an inline comment to the body, and the comment surviving a reopen', {
    annotation: [
        {type: 'confluence', description: '1308524935 complete'}, // Add inline comment
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: SNAPSHOT});

    const headline = 'Inline comment added';

    await createArticle(page, headline);

    const body = await typeBody(page);
    const highlightColor = await getCommentHighlightColor(body);
    const commentButton = getCommentButton(body);
    const dialog = getCommentDialog(page);
    const dialogInput = dialog.getByTestId('comment-textarea').getByRole('textbox');

    // the caret sits at the end of the text it just typed, so nothing is selected
    await expect(commentButton).toHaveClass(/inactive/);

    await selectCommentTarget(page, body);
    await expect(commentButton).not.toHaveClass(/inactive/);
    await commentButton.click();

    await expect(dialogInput).toBeVisible();
    await expect(dialogInput).toHaveAttribute('placeholder', 'Type your comment...');
    await expect(dialogInput).toHaveValue('');
    await expect(dialog.getByTestId('submit')).toBeDisabled();

    await expect(async () => {
        await dialogInput.fill('discarded by Cancel');
        await expect(dialogInput).toHaveValue('discarded by Cancel', {timeout: 1000});
    }).toPass();
    await expect(dialog.getByTestId('submit')).toBeEnabled();

    await dialog.getByTestId('cancel').click();
    await expect(dialog).toHaveCount(0);
    await expect(getEditor3TextRun(body, BODY_TEXT)).toHaveCSS('background-color', NO_BACKGROUND);

    await addComment(page, body, COMMENT_TEXT);

    await expect(getEditor3TextRun(body, COMMENTED_TEXT)).toHaveCSS('background-color', highlightColor);
    await expect(getEditor3TextRun(body, PLAIN_TEXT)).toHaveCSS('background-color', NO_BACKGROUND);

    const popup = getCommentPopup(page);

    await expect(async () => {
        await clickCommentedText(body);
        await expect(popup.getByTestId('comment-author')).toHaveText('John Doe', {timeout: 2000});
        await expect(popup.getByTestId('comment-label')).toHaveText('Comment', {timeout: 2000});
        await expect(popup.getByTestId('comment-text')).toHaveText(COMMENT_TEXT, {timeout: 2000});
    }).toPass({timeout: 30000});

    await getEditor3TextRun(body, PLAIN_TEXT).click();
    await expect(popup).toBeHidden();

    await saveCloseAndReopen(page, headline);

    await expect(getEditor3TextRun(body, COMMENTED_TEXT)).toHaveCSS('background-color', highlightColor);
    await expect(getEditor3TextRun(body, PLAIN_TEXT)).toHaveCSS('background-color', NO_BACKGROUND);

    await expectCommentText(page, body, COMMENT_TEXT);
});

test('editing an inline comment from its detail popup, and the edit surviving a reopen', {
    annotation: [
        {type: 'confluence', description: '1311834931 complete'}, // Edit inline comment
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: SNAPSHOT});

    const headline = 'Inline comment edited';

    const body = await createArticleWithComment(page, headline);
    const popup = getCommentPopup(page);
    const commentBody = popup.getByTestId('comment-text');

    await expect(async () => {
        await clickCommentedText(body);
        await expect(popup.getByTestId('user-avatar')).toBeVisible({timeout: 2000});
        await expect(popup.getByTestId('comment-author')).toHaveText('John Doe', {timeout: 2000});
        await expect(popup.getByTestId('comment-date')).toHaveText(POPUP_DATE, {timeout: 2000});
        await expect(popup.getByTestId('comment-label')).toHaveText('Comment', {timeout: 2000});
        await expect(commentBody).toHaveText(COMMENT_TEXT, {timeout: 2000});
    }).toPass({timeout: 30000});

    const menu = popup.getByTestId('highlight-actions-menu').first();

    await clickInPopup(popup.getByTestId('highlight-actions-toggle').first());
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('button')).toHaveText(['Edit', 'Delete']);
    await clickInPopup(getCommentAction(menu, 'Edit'));

    await expect(commentBody.getByTestId('comment-textarea')).toBeVisible();
    await expect(popup.getByTestId('resolve')).toBeVisible();
    await expect(popup.getByTestId('add-reply').getByTestId('comment-textarea')).toBeVisible();

    const editInput = commentBody.getByTestId('comment-textarea').getByRole('textbox');

    await expect(async () => {
        await editInput.fill('discarded edit');
        await expect(editInput).toHaveValue('discarded edit', {timeout: 1000});
    }).toPass({timeout: 15000});
    await clickInPopup(commentBody.getByTestId('cancel'));

    await expect(commentBody.getByTestId('comment-textarea')).toBeHidden();
    await expect(commentBody).toHaveText(COMMENT_TEXT);

    await executeCommentAction(popup, 'Edit');
    await submitEditedMessage(popup, EDITED_COMMENT_TEXT);

    await expect(commentBody.getByTestId('comment-textarea')).toBeHidden();
    await expect(commentBody).toHaveText(EDITED_COMMENT_TEXT);

    await saveCloseAndReopen(page, headline);

    await expectCommentText(page, body, EDITED_COMMENT_TEXT);
});

test('deleting an inline comment through its confirmation dialog', {
    annotation: [
        {type: 'confluence', description: '1311834933 complete'}, // Delete inline comment
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: SNAPSHOT});

    const headline = 'Inline comment deleted';

    const body = await createArticleWithComment(page, headline);
    const highlightColor = await getCommentHighlightColor(body);
    const popup = await openCommentPopup(page, body);
    const confirm = page.getByTestId('modal-confirm');

    await executeCommentAction(popup, 'Delete');

    await expect(confirm).toBeVisible();
    await expect(confirm).toHaveAccessibleName('Confirm');
    await expect(confirm).toContainText('The comment will be deleted. Are you sure?');

    await confirm.getByRole('button', {name: 'Cancel', exact: true}).click();
    await expect(confirm).toBeHidden();
    await expect(getEditor3TextRun(body, COMMENTED_TEXT)).toHaveCSS('background-color', highlightColor);

    await executeCommentAction(popup, 'Delete');
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', {name: 'OK', exact: true}).click();

    await expect(confirm).toBeHidden();
    await expect(popup).toBeHidden();

    // the commented word is no longer a leaf of its own once the highlight is gone
    await expect(getEditor3TextRun(body, BODY_TEXT)).toHaveCSS('background-color', NO_BACKGROUND);

    await saveCloseAndReopen(page, headline);

    await expect(getEditor3TextRun(body, BODY_TEXT)).toHaveCSS('background-color', NO_BACKGROUND);

    const widget = await openCommentsWidget(page);

    await expect(widget.getByText('No comments have been posted')).toBeVisible();
    await expect(widget.getByTestId('inline-comment')).toHaveCount(0);
});

test('replying to an inline comment with and without a mention, and only the author editing or deleting it', {
    annotation: [
        {type: 'confluence', description: '1311834929 complete'}, // Reply to inline comment
    ],
}, async ({page, browser}) => {
    test.setTimeout(120000);

    await restoreDatabaseSnapshot({snapshotName: SNAPSHOT});

    const authoring = new AuthoringReact(page);
    const headline = 'Inline comment replied to';

    const body = await createArticleWithComment(page, headline);
    const popup = await openCommentPopup(page, body);
    const addReplyBox = popup.getByTestId('add-reply');
    const replyInput = addReplyBox.getByTestId('comment-textarea').getByRole('textbox');
    const reply = popup.getByTestId('comment-reply');

    await expect(replyInput).toHaveAttribute('placeholder', 'Reply');

    // the Reply/Cancel toolbar only renders while the reply field holds focus
    await expect(addReplyBox.getByTestId('submit')).toHaveCount(0);
    await focusReplyField(popup);

    await expect(async () => {
        await replyInput.fill('discarded reply');
        await expect(replyInput).toHaveValue('discarded reply', {timeout: 1000});
    }).toPass({timeout: 15000});
    await clickInPopup(addReplyBox.getByTestId('cancel'));

    await expect(replyInput).toHaveValue('');
    await expect(addReplyBox.getByTestId('submit')).toHaveCount(0);
    await expect(reply).toHaveCount(0);

    await addReply(body, REPLY_TEXT);

    await expect(reply).toHaveCount(1);
    await expect(reply.getByTestId('comment-author')).toHaveText('John Doe');
    await expect(reply.getByTestId('comment-text')).toHaveText(REPLY_TEXT);

    await executeCommentAction(reply, 'Edit');
    await submitEditedMessage(reply, EDITED_REPLY_TEXT);

    await expect(reply.getByTestId('comment-text')).toHaveText(EDITED_REPLY_TEXT);

    const confirm = page.getByTestId('modal-confirm');

    await executeCommentAction(reply, 'Delete');
    await expect(confirm).toContainText('The reply will be deleted. Are you sure?');
    await confirm.getByRole('button', {name: 'OK', exact: true}).click();

    await expect(confirm).toBeHidden();

    // unlike angular, deleting the reply closes the popup, so it is reopened to read it
    await expectCommentText(page, body, COMMENT_TEXT);
    await expect(reply).toHaveCount(0);

    await focusReplyField(popup);
    await mentionSamGamgee(page, replyInput);
    await replyInput.pressSequentially('see this');
    await clickInPopup(addReplyBox.getByTestId('submit'));

    await expect(reply).toHaveCount(1);
    await expect(reply.getByTestId('comment-text')).toHaveText('Sam Gamgee see this');
    await expect(reply.getByTestId('comment-text').getByRole('link')).toHaveText('Sam Gamgee');

    await authoring.saveAndClose();

    const other = await newSession(browser, SAM);

    try {
        const otherPage = other.page;
        const otherMonitoring = new Monitoring(otherPage);

        await otherPage.goto('/#/workspace/monitoring');
        await otherMonitoring.selectDeskOrWorkspace('Sports');
        await otherMonitoring.getArticleLocator(headline).dblclick();
        await new AuthoringReact(otherPage).waitUntilOpen();

        const otherBody = getEditor3Field(otherPage, 'body_html');
        const otherPopup = getCommentPopup(otherPage);

        // read in one go from an open popup: on a just-opened article it closes on its own
        await expect(async () => {
            await clickCommentedText(otherBody);

            const seen = await otherPopup.evaluate((element) => {
                const replyTexts = '[data-test-id="comment-reply"] [data-test-id="comment-text"]';

                return {
                    replies: Array.from(element.querySelectorAll(replyTexts), (el) => el.textContent),
                    links: Array.from(element.querySelectorAll(`${replyTexts} a[href]`), (el) => el.textContent),
                    menus: element.querySelectorAll('[data-test-id="highlight-actions-toggle"]').length,
                };
            }, undefined, {timeout: 2000});

            expect(seen).toEqual({replies: ['Sam Gamgee see this'], links: ['Sam Gamgee'], menus: 0});
        }).toPass({timeout: 30000});

        await addReply(otherBody, 'reply by Sam');

        await expect(async () => {
            await clickCommentedText(otherBody);

            const seen = await otherPopup.evaluate((element) => ({
                replies: Array.from(element.querySelectorAll('[data-test-id="comment-reply"]'), (item) => ({
                    text: item.querySelector('[data-test-id="comment-text"]')?.textContent,
                    author: item.querySelector('[data-test-id="comment-author"]')?.textContent,
                    menus: item.querySelectorAll('[data-test-id="highlight-actions-toggle"]').length,
                })),
                menus: element.querySelectorAll('[data-test-id="highlight-actions-toggle"]').length,
            }), undefined, {timeout: 2000});

            expect(seen).toEqual({
                replies: [
                    {text: 'Sam Gamgee see this', author: 'John Doe', menus: 0},
                    {text: 'reply by Sam', author: 'Sam Gamgee', menus: 1},
                ],
                menus: 1,
            });
        }).toPass({timeout: 30000});
    } finally {
        await other.context.close();
    }
});

/**
 * Adds comments to the body and to the abstract (enabled on the Story profile in-test, since
 * `editor3-comments` enables them on the body only), replies to the body one and saves. Leaves
 * the article open on a fresh reopen.
 */
async function createArticleWithTwoComments(
    page: Page,
    headline: string,
    abstractCommentText: string,
): Promise<Locator> {
    await page.goto('/#/settings/content-profiles');
    await new ContentProfileSettings(page).addFormattingOptionToContentProfile({
        profileName: 'Story',
        sectionName: 'Content fields',
        fieldName: 'Abstract',
        formattingOptionsToAdd: ['bold', 'italic', 'underline', 'link', 'comments'],
    });

    const body = await createArticleWithComment(page, headline);

    await openCommentPopup(page, body);
    await addReply(body, REPLY_TEXT);
    await expect(getCommentPopup(page).getByTestId('comment-reply')).toHaveCount(1);

    const abstract = await typeIntoEditor3Field(page, 'abstract', BODY_TEXT);

    await addComment(page, abstract, abstractCommentText);
    await saveCloseAndReopen(page, headline);

    return body;
}

test('listing inline comments in the widget grouped by field, and resolving one moving it across the tabs', {
    annotation: [
        {type: 'confluence', description: '1311834927 complete'}, // Resolve inline comment
        {type: 'confluence', description: '1311834935 partial'}, // Inline comments in Editor Sidebar
    ],
}, async ({page}) => {
    test.setTimeout(120000);

    await restoreDatabaseSnapshot({snapshotName: SNAPSHOT});

    const headline = 'Inline comment resolved';
    const abstractCommentText = 'first thoughts on the abstract';

    const body = await createArticleWithTwoComments(page, headline, abstractCommentText);
    const highlightColor = await getCommentHighlightColor(body);

    const widget = await openCommentsWidget(page);
    const groups = widget.getByTestId('inline-comments-group');
    const bodyGroup = groups.and(page.locator('[data-test-value="Body HTML"]'));
    const abstractGroup = groups.and(page.locator('[data-test-value="Abstract"]'));

    // with unresolved comments present the widget opens on the Unresolved tab
    await expect(getWidgetTab(widget, 'Unresolved')).toHaveText('Unresolved (2)');
    await expect(getWidgetTab(widget, 'Resolved')).toHaveText('Resolved (0)');
    await expect(groups).toHaveCount(2);
    await expect(abstractGroup.getByTestId('inline-comment')).toHaveCount(1);
    await expect(abstractGroup.getByTestId('inline-comment')).toContainText(abstractCommentText);
    await expect(bodyGroup.getByTestId('inline-comment')).toHaveCount(1);
    await expect(bodyGroup.getByTestId('inline-comment')).toContainText('John Doe');
    await expect(bodyGroup.getByTestId('inline-comment')).toContainText(COMMENT_TEXT);

    await expect(getEditor3TextRun(body, COMMENTED_TEXT)).toHaveCSS('background-color', highlightColor);

    const popup = await openCommentPopup(page, body);

    await clickInPopup(popup.getByTestId('resolve'));

    await expect(popup).toBeHidden();
    await expect(getEditor3TextRun(body, BODY_TEXT)).toHaveCSS('background-color', NO_BACKGROUND);

    // the widget reads the live field values, so the resolution shows without a save
    await expect(getWidgetTab(widget, 'Unresolved')).toHaveText('Unresolved (1)');
    await expect(getWidgetTab(widget, 'Resolved')).toHaveText('Resolved (1)');
    await expect(groups).toHaveCount(1);
    await expect(abstractGroup.getByTestId('inline-comment')).toContainText(abstractCommentText);

    await getWidgetTab(widget, 'Resolved').click();
    await expect(groups).toHaveCount(1);
    await expect(bodyGroup.getByTestId('inline-comment')).toHaveCount(1);
    await expect(bodyGroup.getByTestId('inline-comment')).toContainText(COMMENT_TEXT);
    await expect(bodyGroup.getByTestId('commented-text')).toContainText(COMMENTED_TEXT);

    await saveCloseAndReopen(page, headline);

    await expect(getEditor3TextRun(body, BODY_TEXT)).toHaveCSS('background-color', NO_BACKGROUND);

    const reopenedWidget = await openCommentsWidget(page);

    await expect(getWidgetTab(reopenedWidget, 'Resolved')).toHaveText('Resolved (1)');
    await expect(getWidgetTab(reopenedWidget, 'Unresolved')).toHaveText('Unresolved (1)');
});

// React gap: the Inline comments widget shows no selected text for unresolved comments, no replies and no resolver.
test.fixme('the widget lists the selected text, the replies and who resolved a comment, as the angular widget does', {
    annotation: [
        {type: 'confluence', description: '1311834935 partial'}, // Inline comments in Editor Sidebar
    ],
}, async ({page}) => {
    test.setTimeout(120000);

    await restoreDatabaseSnapshot({snapshotName: SNAPSHOT});

    const headline = 'Inline comment replies in widget';
    const body = await createArticleWithTwoComments(page, headline, 'first thoughts on the abstract');
    const unresolvedWidget = await openCommentsWidget(page);
    const unresolvedBody = unresolvedWidget.getByTestId('inline-comments-group')
        .and(page.locator('[data-test-value="Body HTML"]'));

    await expect(unresolvedBody.getByTestId('commented-text')).toContainText(COMMENTED_TEXT);
    await expect(unresolvedBody).toContainText(REPLY_TEXT);

    const popup = await openCommentPopup(page, body);

    await clickInPopup(popup.getByTestId('resolve'));
    await expect(popup).toBeHidden();

    const widget = await openCommentsWidget(page);

    await getWidgetTab(widget, 'Resolved').click();

    const resolved = widget.getByTestId('inline-comments-group')
        .and(page.locator('[data-test-value="Body HTML"]'));

    await expect(resolved).toContainText(COMMENT_TEXT);
    await expect(resolved).toContainText(REPLY_TEXT);
    await expect(resolved).toContainText('Resolved by John Doe');
});

test('notifying a user mentioned in an inline comment, who opens the article and finds it', {
    annotation: [
        {type: 'confluence', description: '1311834938 complete'}, // Notify user via inline comment
    ],
}, async ({page, browser}) => {
    test.setTimeout(120000);

    await restoreDatabaseSnapshot({snapshotName: SNAPSHOT});

    const authoring = new AuthoringReact(page);
    const headline = 'Inline comment mention';
    const slugline = 'mention-slug';

    await createArticle(page, headline);
    await authoring.input('slugline').fill(slugline);

    const body = await typeBody(page);
    const dialog = getCommentDialog(page);
    const dialogInput = dialog.getByTestId('comment-textarea').getByRole('textbox');

    await selectCommentTarget(page, body);
    await getCommentButton(body).click();
    await expect(dialogInput).toBeVisible();

    await mentionSamGamgee(page, dialogInput);
    await dialogInput.pressSequentially('take a look');
    await dialog.getByTestId('submit').click();
    await expect(dialog).toHaveCount(0);

    const popup = await openCommentPopup(page, body);

    await expect(popup.getByTestId('comment-text').getByRole('link')).toHaveText('Sam Gamgee');

    await authoring.saveAndClose();

    const mentioned = await newSession(browser, SAM);

    try {
        const mentionedPage = mentioned.page;

        const unreadBadge = getUnreadNotificationsBadge(mentionedPage);

        await expect(unreadBadge).toBeVisible();
        await expect(unreadBadge).toHaveText('1');

        await mentionedPage.getByRole('button', {name: 'View notifications'}).click();

        const pane = mentionedPage.getByTestId('notification-pane');
        const notification = pane.getByTestId('notification').first();

        await expect(notification).toContainText('John Doe');
        await expect(notification).toContainText('mentioned you');
        await expect(notification).toContainText('Sam Gamgee take a look');
        await expect(notification.getByTestId('open-article')).toHaveText(slugline);

        await notification.getByTestId('open-article').click();

        await expect(new AuthoringReact(mentionedPage).input('headline')).toHaveText(headline);

        const widget = await openCommentsWidget(mentionedPage);
        const listed = widget.getByTestId('inline-comment');

        await expect(getWidgetTab(widget, 'Unresolved')).toHaveText('Unresolved (1)');
        await expect(listed).toHaveCount(1);
        await expect(listed).toContainText('take a look');
    } finally {
        await mentioned.context.close();
    }
});

// React gap: the Inline comments widget prints a mention as raw `@[name](user:id)` markup instead of the user's name.
test.fixme('the widget renders a mention in a comment as the mentioned user\'s name', {
    annotation: [
        {type: 'confluence', description: '1311834938 partial'}, // Notify user via inline comment
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: SNAPSHOT});

    const headline = 'Inline comment mention in widget';

    await createArticle(page, headline);

    const body = await typeBody(page);
    const dialog = getCommentDialog(page);
    const dialogInput = dialog.getByTestId('comment-textarea').getByRole('textbox');

    await selectCommentTarget(page, body);
    await getCommentButton(body).click();
    await mentionSamGamgee(page, dialogInput);
    await dialogInput.pressSequentially('take a look');
    await dialog.getByTestId('submit').click();
    await expect(dialog).toHaveCount(0);

    const widget = await openCommentsWidget(page);
    const listed = widget.getByTestId('inline-comment');

    await expect(listed).toContainText('Sam Gamgee take a look');
    await expect(listed).not.toContainText('@[');
});
