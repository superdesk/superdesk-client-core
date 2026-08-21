import {Locator, Page, expect, test} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {loginAs, pressRepeatedly, restoreDatabaseSnapshot} from './utils';
import {getEditor3Field, getEditor3TextRun} from './utils/editor3';

/**
 * Editor3 inline comments: adding, editing, deleting, replying, resolving, the Inline
 * comments widget and the notification a mentioned user receives.
 *
 * Where the product's wording differs from the QA cases, the assertions follow the
 * product:
 * - the comment field's placeholder is "Type your comment..."; the cases write it
 *   without the dots.
 * - the editing case calls the two buttons "Submit" and "Cancel"; the product renders
 *   icon-only buttons (`icon-ok`, `icon-close-small` in `Comment.tsx`), so they're
 *   located by test id.
 * - "the default text is hidden as you start typing" is native placeholder behaviour
 *   with no DOM counterpart; covered by asserting the attribute is set and the value
 *   goes from empty to the typed text.
 * - the Inline comments widget opens on Resolved, not Unresolved: `InlineCommentsCtrl`
 *   seeds `$scope.resolvedFilter = 'RESOLVED'` (track-changes/inline-comments.ts).
 * - STT-1425, which the notification case records: the notification link names the
 *   item and opens the article, not the comment inside it. The spec asserts that and
 *   then finds the comment through the widget, which is what the case's last step
 *   describes anyway. The article gets a slugline because the link is named after it.
 */

/**
 * Every case builds its own article, comments on it, and most of them save and reopen it,
 * which does not fit the 30s default.
 */
test.describe.configure({timeout: 120000});

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

/**
 * The toolbar Comment button, narrowed to the inner `span`. `SelectionButton` carries
 * no test id: the accessible name comes from the tooltip on the outer element, while
 * the click handler and the `inactive` ("nothing selected") class sit on the span.
 */
function getCommentButton(body: Locator): Locator {
    return body.getByTestId('toolbar')
        .getByRole('button', {name: 'Comment', exact: true})
        .locator('span');
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
 * inside the field instead of being hardcoded.
 */
function getCommentHighlightColor(body: Locator): Promise<string> {
    return body.evaluate((element) => {
        const probe = document.createElement('span');

        probe.style.backgroundColor = 'var(--sd-editor-colour__comment-bg)';
        element.appendChild(probe);

        const color = window.getComputedStyle(probe).backgroundColor;

        probe.remove();

        return color;
    });
}

async function typeBody(page: Page): Promise<Locator> {
    const body = getEditor3Field(page, 'body_html');
    const input = body.getByRole('textbox');

    await expect(input).toBeVisible();
    await input.click();
    await page.keyboard.type(BODY_TEXT);
    await expect(getEditor3TextRun(body, BODY_TEXT)).toBeVisible();

    return body;
}

/**
 * Puts the caret at the end of the body and extends the selection back over the
 * trailing word, which is what lets the Comment button leave its inactive state.
 * Counted ArrowRight presses rather than End, which doesn't move the caret on macOS.
 */
async function selectCommentTarget(page: Page, body: Locator): Promise<void> {
    await getEditor3TextRun(body, COMMENTED_TEXT).click();
    await pressRepeatedly(page, 'ArrowRight', BODY_TEXT.length);
    await pressRepeatedly(page, 'Shift+ArrowLeft', COMMENTED_TEXT.length);
}

/**
 * The comment entry popup opened by the toolbar Comment button. Assert visibility on
 * the field inside it, never on this element: it's only a scope whose single child is
 * an absolutely positioned dropdown, so the element itself has no size.
 */
function getCommentDialog(page: Page): Locator {
    return page.getByTestId('comment-input');
}

/** Adds a comment on the trailing word of the body through the toolbar Comment flow. */
async function addComment(page: Page, body: Locator, message: string): Promise<void> {
    const dialog = getCommentDialog(page);
    const input = dialog.getByTestId('comment-textarea').getByRole('textbox');

    await selectCommentTarget(page, body);
    await expect(getCommentButton(body)).not.toHaveClass(/inactive/);
    await getCommentButton(body).click();

    await expect(input).toBeVisible();
    await input.fill(message);
    await expect(input).toHaveValue(message);

    await dialog.getByTestId('submit').click();
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
 * Clicks a control inside the comment popup. The popup doesn't hold still:
 * `HighlightsPopup` re-renders it by unmounting and remounting, and the positioner
 * moves it after every document click, so Playwright's actionability checks lose the
 * race (unstable, then detached). Dispatching the event only waits for attachment,
 * and React 16 listens at the document, so its handler still gets the click.
 */
function clickInPopup(target: Locator): Promise<void> {
    return target.dispatchEvent('click');
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

/** Rewrites the message of a comment or reply that is already open for editing. */
async function submitEditedMessage(target: Locator, message: string): Promise<void> {
    const body = target.getByTestId('comment-text');

    await body.getByTestId('comment-textarea').getByRole('textbox').fill(message);
    await clickInPopup(body.getByTestId('submit'));
}

/**
 * Focuses the reply field, which is what renders the Reply/Cancel toolbar under it
 * (`CommentPopup` keeps a `replyFieldFocused` flag). The blur first matters: Cancel
 * clears the flag while the field keeps DOM focus, and focusing an already-focused
 * field raises no focus event, so the toolbar would stay away.
 */
async function focusReplyField(popup: Locator): Promise<void> {
    const addReply = popup.getByTestId('add-reply');

    await addReply.getByTestId('comment-textarea').getByRole('textbox')
        .evaluate((element: HTMLElement) => element.blur());
    await addReply.getByTestId('comment-textarea').getByRole('textbox').focus();

    await expect(addReply.getByTestId('submit')).toBeVisible();
}

async function addReply(popup: Locator, message: string): Promise<void> {
    const addReply = popup.getByTestId('add-reply');

    await focusReplyField(popup);
    await addReply.getByTestId('comment-textarea').getByRole('textbox').fill(message);
    await clickInPopup(addReply.getByTestId('submit'));
}

/**
 * Creates an article from the desk's default template, gives it a headline and a body,
 * comments on the trailing word and saves. Every case but "Add inline comment" starts
 * from a saved article that already carries a comment, and no snapshot ships one. The
 * save also marks the point where editor3 has handed its change to the authoring
 * model, so what follows isn't racing that hand-over.
 */
async function createArticleWithComment(page: Page, headline: string): Promise<Locator> {
    const authoring = new Authoring(page);
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.createArticleFromDefaultTemplate();

    const headlineField = page.getByTestId('field--headline').getByRole('textbox');

    await expect(headlineField).toBeVisible();
    await headlineField.fill(headline);

    const body = await typeBody(page);

    await addComment(page, body, COMMENT_TEXT);
    await authoring.save();

    return body;
}

test('adding an inline comment to the body, and the comment surviving a reopen', {
    annotation: [
        {type: 'confluence', description: '1308524935 complete'}, // Add inline comment
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: SNAPSHOT});

    const authoring = new Authoring(page);
    const monitoring = new Monitoring(page);
    const headline = 'Inline comment added';

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.createArticleFromDefaultTemplate();

    const headlineField = page.getByTestId('field--headline').getByRole('textbox');

    await expect(headlineField).toBeVisible();
    await headlineField.fill(headline);

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

    await dialogInput.fill('discarded by Cancel');
    await expect(dialogInput).toHaveValue('discarded by Cancel');
    await expect(dialog.getByTestId('submit')).toBeEnabled();

    await dialog.getByTestId('cancel').click();
    await expect(dialog).toHaveCount(0);
    await expect(getEditor3TextRun(body, BODY_TEXT)).toHaveCSS('background-color', NO_BACKGROUND);

    await addComment(page, body, COMMENT_TEXT);

    await expect(getEditor3TextRun(body, COMMENTED_TEXT)).toHaveCSS('background-color', highlightColor);
    await expect(getEditor3TextRun(body, PLAIN_TEXT)).toHaveCSS('background-color', NO_BACKGROUND);

    const popup = await openCommentPopup(page, body);

    await expect(popup.getByTestId('comment-author')).toHaveText('John Doe');
    await expect(popup.getByTestId('comment-label')).toHaveText('Comment');
    await expect(popup.getByTestId('comment-text')).toHaveText(COMMENT_TEXT);

    // clicking text that carries no comment collapses the caret outside the highlight,
    // which is what closes the popup
    await getEditor3TextRun(body, PLAIN_TEXT).click();
    await expect(popup).toBeHidden();

    await authoring.save();
    await authoring.close();

    await monitoring.getArticleLocator(headline).dblclick();
    await expect(headlineField).toHaveText(headline);

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

    const authoring = new Authoring(page);
    const monitoring = new Monitoring(page);
    const headline = 'Inline comment edited';

    const body = await createArticleWithComment(page, headline);
    const popup = await openCommentPopup(page, body);
    const commentBody = popup.getByTestId('comment-text');

    await expect(popup.getByTestId('user-avatar')).toBeVisible();
    await expect(popup.getByTestId('comment-author')).toHaveText('John Doe');
    await expect(popup.getByTestId('comment-date')).not.toBeEmpty();
    await expect(popup.getByTestId('comment-label')).toHaveText('Comment');
    await expect(commentBody).toHaveText(COMMENT_TEXT);

    const menu = popup.getByTestId('highlight-actions-menu').first();

    await clickInPopup(popup.getByTestId('highlight-actions-toggle').first());
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('button')).toHaveText(['Edit', 'Delete']);
    await clickInPopup(getCommentAction(menu, 'Edit'));

    await expect(commentBody.getByTestId('comment-textarea')).toBeVisible();
    await expect(popup.getByTestId('resolve')).toBeVisible();
    await expect(popup.getByTestId('add-reply').getByTestId('comment-textarea')).toBeVisible();

    await commentBody.getByTestId('comment-textarea').getByRole('textbox').fill('discarded edit');
    await clickInPopup(commentBody.getByTestId('cancel'));

    await expect(commentBody.getByTestId('comment-textarea')).toBeHidden();
    await expect(commentBody).toHaveText(COMMENT_TEXT);

    await executeCommentAction(popup, 'Edit');
    await submitEditedMessage(popup, EDITED_COMMENT_TEXT);

    await expect(commentBody.getByTestId('comment-textarea')).toBeHidden();
    await expect(commentBody).toHaveText(EDITED_COMMENT_TEXT);

    await authoring.save();
    await authoring.close();

    await monitoring.getArticleLocator(headline).dblclick();

    await expectCommentText(page, body, EDITED_COMMENT_TEXT);
});

test('deleting an inline comment through its confirmation dialog', {
    annotation: [
        {type: 'confluence', description: '1311834933 complete'}, // Delete inline comment
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: SNAPSHOT});

    const authoring = new Authoring(page);
    const monitoring = new Monitoring(page);
    const headline = 'Inline comment deleted';

    const body = await createArticleWithComment(page, headline);
    const highlightColor = await getCommentHighlightColor(body);
    const popup = await openCommentPopup(page, body);
    const confirm = page.getByTestId('modal-confirm');

    await executeCommentAction(popup, 'Delete');

    await expect(confirm).toBeVisible();

    // the dialog's title is its accessible name; it is not rendered as a heading
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

    await authoring.save();
    await authoring.close();

    await monitoring.getArticleLocator(headline).dblclick();

    await expect(getEditor3TextRun(body, BODY_TEXT)).toHaveCSS('background-color', NO_BACKGROUND);

    const widget = await authoring.openWidget('Inline comments');

    await widget.getByTestId('filter-unresolved').click();
    await expect(widget.getByTestId('no-comments')).toBeVisible();
});

test('replying to an inline comment, then editing and deleting the reply', {
    annotation: [
        {type: 'confluence', description: '1311834929 complete'}, // Reply to inline comment
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: SNAPSHOT});

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

    await replyInput.fill('discarded reply');
    await clickInPopup(addReplyBox.getByTestId('cancel'));

    await expect(replyInput).toHaveValue('');
    await expect(addReplyBox.getByTestId('submit')).toHaveCount(0);
    await expect(reply).toHaveCount(0);

    await addReply(popup, REPLY_TEXT);

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
    await expect(reply).toHaveCount(0);

    // with the reply gone the popup holds one message again, the comment's own
    await expect(popup.getByTestId('comment-text')).toHaveText(COMMENT_TEXT);
});

test('listing inline comments in the widget, and resolving one moving it across the filters', {
    annotation: [
        {type: 'confluence', description: '1311834927 complete'}, // Resolve inline comment
        {type: 'confluence', description: '1311834935 complete'}, // Inline comments in Editor Sidebar
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: SNAPSHOT});

    const authoring = new Authoring(page);
    const monitoring = new Monitoring(page);
    const headline = 'Inline comment resolved';

    const body = await createArticleWithComment(page, headline);
    const popup = await openCommentPopup(page, body);

    await addReply(popup, REPLY_TEXT);
    await expect(popup.getByTestId('comment-reply')).toHaveCount(1);

    await authoring.save();

    const widget = await authoring.openWidget('Inline comments');
    const group = widget.getByTestId('inline-comments-group');
    const listed = widget.getByTestId('inline-comment');

    // InlineCommentsCtrl seeds the filter with RESOLVED, so the widget opens on the
    // Resolved list rather than on Unresolved
    await expect(widget.getByTestId('no-comments')).toBeVisible();

    await widget.getByTestId('filter-unresolved').click();
    await expect(group).toHaveCount(1);
    await expect(group).toHaveAttribute('data-test-value', 'Body HTML');
    await expect(listed).toHaveCount(1);
    await expect(listed.getByTestId('author').first()).toHaveText('John Doe:');
    await expect(listed.getByTestId('date').first()).not.toBeEmpty();
    await expect(listed).toContainText(COMMENT_TEXT);
    await expect(listed.getByTestId('inline-comment-reply')).toHaveCount(1);
    await expect(listed.getByTestId('inline-comment-reply')).toContainText(REPLY_TEXT);
    await expect(listed.getByTestId('commented-text')).toContainText(COMMENTED_TEXT);
    await expect(listed.getByTestId('resolution')).toHaveCount(0);

    // the controller reads the item once per activation, so the widget has to be closed
    // before the comment is resolved and reopened afterwards to show the new state
    await authoring.closeWidget('Inline comments');

    const reopenedPopup = await openCommentPopup(page, body);

    await clickInPopup(reopenedPopup.getByTestId('resolve'));

    await expect(reopenedPopup).toBeHidden();
    await expect(getEditor3TextRun(body, BODY_TEXT)).toHaveCSS('background-color', NO_BACKGROUND);

    await authoring.save();

    const reopenedWidget = await authoring.openWidget('Inline comments');
    const resolved = reopenedWidget.getByTestId('inline-comment');

    await expect(reopenedWidget.getByTestId('inline-comments-group')).toHaveCount(1);
    await expect(resolved).toHaveCount(1);
    await expect(resolved).toContainText(COMMENT_TEXT);
    await expect(resolved.getByTestId('inline-comment-reply')).toHaveCount(1);
    await expect(resolved.getByTestId('inline-comment-reply')).toContainText(REPLY_TEXT);
    await expect(resolved.getByTestId('commented-text')).toContainText(COMMENTED_TEXT);
    await expect(resolved.getByTestId('resolution')).toContainText('Resolved by John Doe');

    await reopenedWidget.getByTestId('filter-unresolved').click();
    await expect(reopenedWidget.getByTestId('no-comments')).toBeVisible();

    // back through the Resolved control itself: the assertions above reach the resolved
    // list through the filter the controller seeds, never through the radio
    await reopenedWidget.getByTestId('filter-resolved').click();
    await expect(resolved).toHaveCount(1);
    await expect(resolved).toContainText(COMMENT_TEXT);
    await expect(resolved.getByTestId('inline-comment-reply')).toContainText(REPLY_TEXT);
    await expect(resolved.getByTestId('commented-text')).toContainText(COMMENTED_TEXT);
    await expect(resolved.getByTestId('resolution')).toContainText('Resolved by John Doe');

    await authoring.close();

    await monitoring.getArticleLocator(headline).dblclick();

    await expect(getEditor3TextRun(body, BODY_TEXT)).toHaveCSS('background-color', NO_BACKGROUND);
});

test('notifying a user mentioned in an inline comment, who opens the article and finds it', {
    annotation: [
        {type: 'confluence', description: '1311834938 complete'}, // Notify user via inline comment
    ],
}, async ({page, browser}) => {
    await restoreDatabaseSnapshot({snapshotName: SNAPSHOT});

    const authoring = new Authoring(page);
    const monitoring = new Monitoring(page);
    const headline = 'Inline comment mention';
    const slugline = 'mention-slug';

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.createArticleFromDefaultTemplate();

    const headlineField = page.getByTestId('field--headline').getByRole('textbox');

    await expect(headlineField).toBeVisible();
    await headlineField.fill(headline);
    await page.getByTestId('authoring').getByTestId('field-slugline').fill(slugline);

    const body = await typeBody(page);
    const dialog = getCommentDialog(page);
    const dialogInput = dialog.getByTestId('comment-textarea').getByRole('textbox');

    await selectCommentTarget(page, body);
    await getCommentButton(body).click();
    await expect(dialogInput).toBeVisible();

    // the mention has to be typed: react-mentions only queries its data source from
    // keystrokes, and only picking a suggestion writes the `@[name](user:id)` markup the
    // backend scans for. Its suggestion list is third-party markup with no test id.
    await dialogInput.pressSequentially('@Sam');

    const suggestions = page.locator('.mentions-input__suggestions');

    await expect(suggestions).toBeVisible();
    await suggestions.getByText('Sam Gamgee', {exact: true}).click();

    await dialogInput.pressSequentially('take a look');
    await dialog.getByTestId('submit').click();
    await expect(dialog).toHaveCount(0);

    const popup = await openCommentPopup(page, body);

    await expect(popup.getByTestId('comment-text').getByRole('link')).toHaveText('Sam Gamgee');

    await authoring.save();
    await authoring.close();

    const mentionedContext = await browser.newContext({storageState: {cookies: [], origins: []}});
    const mentionedPage = await mentionedContext.newPage();

    try {
        // fixture users with a known password use the username as one
        await loginAs(mentionedPage, 'samgamgee', 'samgamgee');

        // the badge has no test id, and the authoring sidebar reuses the same element id
        // for its comment count, so it is taken from the top menu by position
        const unreadBadge = mentionedPage.locator('#unread-count').first();

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

        const openedHeadline = mentionedPage.getByTestId('field--headline').getByRole('textbox');

        await expect(openedHeadline).toHaveText(headline);

        const mentionedAuthoring = new Authoring(mentionedPage);
        const widget = await mentionedAuthoring.openWidget('Inline comments');

        await widget.getByTestId('filter-unresolved').click();

        const listed = widget.getByTestId('inline-comment');

        await expect(listed).toHaveCount(1);
        await expect(listed).toContainText('Sam Gamgee take a look');
        await expect(listed.getByTestId('commented-text')).toContainText(COMMENTED_TEXT);
    } finally {
        await mentionedContext.close();
    }
});
