import {Locator, Page, expect, test} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {pressRepeatedly, restoreDatabaseSnapshot} from './utils';
import {getEditor3Field, getEditor3FormattingOptions, getEditor3TextRun} from './utils/editor3';

/**
 * Editor3 annotations on the body field: adding one, editing it from its preview and
 * deleting it, each carried through a save and a reopen.
 *
 * No content profile in `main` enables the `annotation` formatting option, so every test
 * runs against the `editor3-annotations` record, which adds it to the Story profile's
 * body_html field and so puts the Annotation button on the toolbar.
 *
 * Where the product's wording or behaviour differs from the QA cases, the assertions follow
 * the product:
 * - the cases call the popup the "Annotation preview". The product gives it no title of its
 *   own; the "Annotation" label the cases list is a label inside it.
 * - the type row is a single element reading "Annotation type: Regular"
 *   (`AnnotationPopup.tsx`), so it is asserted as that whole string.
 * - the edit dialog's Delete button takes the dialog down before the confirmation is
 *   answered: `AnnotationInput.deleteAnnotation` calls `hidePopups()` right after opening
 *   the confirmation, without waiting on it. Cancelling the confirmation therefore leaves
 *   the annotation in place but no dialog open.
 * - "Test the formatting and inserting link in the Annotation body" is a test step, not an
 *   expected result. The four options the edit case does list as an expected result (Bold,
 *   Italic, Underline, Link) are asserted present, and bold is applied to check one of them
 *   works; link insertion is not driven.
 */

/**
 * Every test builds its own article, annotates it, saves and reopens it, which does not fit
 * the 30s default.
 */
test.describe.configure({timeout: 120000});

const SNAPSHOT = 'editor3-annotations';

/**
 * Body text of every article this spec creates, split so that "select the text to annotate"
 * is a fixed number of Shift+Arrow presses over the trailing word and each half stays
 * addressable as its own Draft.js leaf once the annotation splits the block.
 */
const PLAIN_TEXT = 'alpha';
const ANNOTATED_TEXT = 'bravo';
const BODY_TEXT = `${PLAIN_TEXT} ${ANNOTATED_TEXT}`;

const ANNOTATION_TEXT = 'first note on bravo';
const EDITED_ANNOTATION_TEXT = 'second note on bravo';

/**
 * Entries of the `annotation_types` vocabulary in the `main` snapshot, in the order it
 * lists them. `AnnotationInput` seeds a new annotation with the first one.
 */
const FIRST_TYPE = {name: 'Regular', qcode: 'regular'};
const SECOND_TYPE = {name: 'Remark', qcode: 'remark'};

/**
 * The toolbar Annotation button, narrowed to the inner `span`.
 *
 * `SelectionButton` (`scripts/core/editor3/components/toolbar/SelectionButton.tsx`) carries
 * no test id: the accessible name comes from the tooltip on the outer element, while both
 * the click handler and the `inactive` class that marks "no selection, so nothing to
 * annotate" sit on the span inside it.
 */
function getAnnotationButton(body: Locator): Locator {
    return body.getByTestId('toolbar')
        .getByRole('button', {name: 'Annotation', exact: true})
        .locator('span');
}

/** The dialog opened by the toolbar Annotation button and by the preview's Edit action. */
function getAnnotationDialog(page: Page): Locator {
    return page.getByTestId('annotation-input');
}

/**
 * The annotation preview popup. `HighlightsPopup` renders it into the global
 * `#react-placeholder` element rather than inside the editor, so it is looked up on the
 * page and not under the body field.
 */
function getAnnotationPopup(page: Page): Locator {
    return page.getByTestId('annotation');
}

/**
 * Resolves the colour an annotated run is underlined in.
 *
 * The ANNOTATION highlight is applied as an inline
 * `border-bottom: 4px solid var(--sd-editor-colour__adding)`
 * (`scripts/core/editor3/highlightsConfig.ts`). That token is defined per editor theme
 * (`.sd-editor--theme-*` in superdesk-ui-framework), not on `:root`, and resolves through a
 * palette token to an `lch()` value, so it is read through a probe mounted inside the field
 * instead of being hardcoded here.
 */
function getAnnotationUnderlineColor(body: Locator): Promise<string> {
    return body.evaluate((element) => {
        const probe = document.createElement('span');

        probe.style.borderBottom = '4px solid var(--sd-editor-colour__adding)';
        element.appendChild(probe);

        const color = window.getComputedStyle(probe).borderBottomColor;

        probe.remove();

        return color;
    });
}

async function expectAnnotatedRun(run: Locator, color: string): Promise<void> {
    await expect(run).toBeVisible();
    await expect(run).toHaveCSS('border-bottom-style', 'solid');
    await expect(run).toHaveCSS('border-bottom-width', '4px');
    await expect(run).toHaveCSS('border-bottom-color', color);
}

async function expectPlainRun(run: Locator): Promise<void> {
    await expect(run).toBeVisible();
    await expect(run).toHaveCSS('border-bottom-style', 'none');
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
 * Puts the caret at the end of the body and extends the selection back over the trailing
 * word, which is the state the Annotation button needs to leave its inactive state.
 *
 * The caret is walked to the end with counted ArrowRight presses (they stop at the end of
 * the last block) rather than End, which does not move the caret on macOS.
 */
async function selectAnnotationTarget(page: Page, body: Locator): Promise<void> {
    await getEditor3TextRun(body, ANNOTATED_TEXT).click();
    await pressRepeatedly(page, 'ArrowRight', BODY_TEXT.length);
    await pressRepeatedly(page, 'Shift+ArrowLeft', ANNOTATED_TEXT.length);
}

/** The nested editor3 field the annotation body is written in, toolbar included. */
function getAnnotationBodyField(dialog: Locator): Locator {
    return dialog.getByTestId('annotation-body-input');
}

/** The writable area of the nested editor3 field the annotation body is written in. */
function getAnnotationBodyInput(dialog: Locator): Locator {
    return getAnnotationBodyField(dialog).getByRole('textbox');
}

/**
 * Replaces the annotation body with `message`.
 *
 * The nested editor is a `contenteditable`, so it is rewritten by selecting all of it and
 * typing over the selection; `fill` does not apply to Draft.js. Select-all is scoped by the
 * click that precedes it, which puts the caret inside the nested editor.
 */
async function writeAnnotationBody(dialog: Locator, message: string): Promise<void> {
    const input = getAnnotationBodyInput(dialog);

    await input.click();
    await input.press('ControlOrMeta+a');
    await input.pressSequentially(message);
    await expect(input).toHaveText(message);
}

/**
 * Adds an annotation on the trailing word of the body through the toolbar Annotation flow,
 * typed as `SECOND_TYPE` so that a type other than the seeded default is what gets stored.
 */
async function addAnnotation(page: Page, body: Locator, message: string): Promise<void> {
    const dialog = getAnnotationDialog(page);

    await selectAnnotationTarget(page, body);
    await expect(getAnnotationButton(body)).not.toHaveClass(/inactive/);
    await getAnnotationButton(body).click();

    await expect(getAnnotationBodyInput(dialog)).toBeVisible();
    await dialog.getByTestId('annotation-type-select').selectOption({label: SECOND_TYPE.name});
    await writeAnnotationBody(dialog, message);

    await dialog.getByTestId('submit').click();
    await expect(dialog).toHaveCount(0);
}

/**
 * Clicks the unannotated half of the body and then the annotated word, which is the pair
 * that brings the preview popup up.
 *
 * On an article that was just opened, clicking the annotated word does not bring the popup
 * up on its own, however many times it is clicked; the caret has to land elsewhere in the
 * field first, so that the click on the annotated word moves it onto the highlight. Placing
 * the caret on the unannotated half every time keeps the helper working in that state and
 * in an article whose body was just typed.
 */
async function clickAnnotatedText(body: Locator): Promise<void> {
    await getEditor3TextRun(body, PLAIN_TEXT).click();
    await getEditor3TextRun(body, ANNOTATED_TEXT).click();
}

/**
 * Opens the preview popup of the annotation on the trailing word.
 *
 * The click pair is retried because the popup can be taken down again a moment after it
 * opens: `HighlightsPopup` unmounts it from `componentDidUpdate` whenever the caret it then
 * sees is not on a highlight, and the editor3 field re-renders on its own for a while after
 * an edit.
 */
async function openAnnotationPopup(page: Page, body: Locator): Promise<Locator> {
    const popup = getAnnotationPopup(page);

    await expect(async () => {
        await clickAnnotatedText(body);
        await expect(popup).toBeVisible({timeout: 2000});
    }).toPass({timeout: 30000});

    return popup;
}

/**
 * Asserts the type and the body of the annotation on the trailing word, reopening the popup
 * as often as it takes.
 *
 * Reach for it on an article that was just reopened, where `openAnnotationPopup` alone is
 * not enough: editor3 resets its selection once more while it initializes, which drops the
 * caret off the highlight and unmounts a popup that had already come up, so an assertion
 * made after the helper returned finds it gone. Retrying the open together with the
 * assertions is what survives that, and the inner timeouts are kept short so one popup that
 * went away again costs a retry rather than the whole budget.
 */
async function expectReopenedAnnotation(
    page: Page,
    body: Locator,
    expected: {type: string; message: string},
): Promise<void> {
    const popup = getAnnotationPopup(page);

    await expect(async () => {
        await clickAnnotatedText(body);
        await expect(popup.getByTestId('annotation-type'))
            .toHaveText(`Annotation type: ${expected.type}`, {timeout: 2000});
        await expect(popup.getByTestId('annotation-body')).toHaveText(expected.message, {timeout: 2000});
    }).toPass({timeout: 30000});
}

/**
 * Clicks a control inside the preview popup.
 *
 * The popup does not hold still: `HighlightsPopup` re-renders it by unmounting and mounting
 * it again (`renderCustom`), and `HighlightsPopupPositioner` re-measures and moves it after
 * every document click and after every update. Playwright's actionability checks lose that
 * race, reporting the target as unstable and then as detached. Dispatching the event waits
 * only for the element to be attached; React 16 listens at the document, so its handler
 * still receives the event.
 */
function clickInPopup(target: Locator): Promise<void> {
    return target.dispatchEvent('click');
}

/**
 * An entry of the 3-dots action menu of the annotation preview.
 *
 * The entries are matched on their text and not on their accessible name: each one renders
 * an icon element before its label (`EditorHighlightsHeader.tsx` builds them that way), and
 * Chrome folds that icon's glyph into the name.
 */
function getAnnotationAction(menu: Locator, action: string): Locator {
    return menu.getByRole('button').filter({hasText: action});
}

/** Opens the 3-dots action menu of the annotation preview and returns it. */
async function openAnnotationActions(popup: Locator): Promise<Locator> {
    const menu = popup.getByTestId('highlight-actions-menu');

    await clickInPopup(popup.getByTestId('highlight-actions-toggle'));
    await expect(menu).toBeVisible();

    return menu;
}

/** Picks an entry from the 3-dots action menu of the annotation preview. */
async function executeAnnotationAction(popup: Locator, action: string): Promise<void> {
    const menu = await openAnnotationActions(popup);

    await clickInPopup(getAnnotationAction(menu, action));
}

/**
 * Asserts everything the edit and delete cases list under "Annotation preview". Both cases
 * open the same popup on the same annotation, so the assertions live here once.
 */
async function expectAnnotationPreview(
    popup: Locator,
    expected: {type: string; message: string},
): Promise<void> {
    await expect(popup.getByTestId('user-avatar')).toBeVisible();
    await expect(popup.getByTestId('annotation-author')).toHaveText('John Doe');
    await expect(popup.getByTestId('annotation-date')).not.toBeEmpty();
    await expect(popup.getByTestId('annotation-label')).toHaveText('Annotation');
    await expect(popup.getByTestId('annotation-type')).toHaveText(`Annotation type: ${expected.type}`);
    await expect(popup.getByTestId('annotation-body')).toHaveText(expected.message);

    const menu = await openAnnotationActions(popup);

    await expect(menu.getByRole('button')).toHaveText(['Edit', 'Delete']);

    // leave the menu closed so the caller starts from the popup's resting state
    await clickInPopup(popup.getByTestId('highlight-actions-toggle'));
    await expect(menu).toBeHidden();
}

/**
 * Creates an article from the desk's default template, gives it a headline and a body,
 * annotates the body's trailing word and saves. The edit and delete cases both start from a
 * saved article that already carries an annotation, and no snapshot ships one.
 *
 * The save is also the point at which the editor3 field is known to have handed its change
 * over to the authoring model, so what follows is not racing that hand-over.
 */
async function createArticleWithAnnotation(page: Page, headline: string): Promise<Locator> {
    const authoring = new Authoring(page);
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.createArticleFromDefaultTemplate();

    const headlineField = page.getByTestId('field--headline').getByRole('textbox');

    await expect(headlineField).toBeVisible();
    await headlineField.fill(headline);

    const body = await typeBody(page);

    await addAnnotation(page, body, ANNOTATION_TEXT);
    await authoring.save();

    return body;
}

test('adding an annotation to the body, and the annotation surviving a reopen', {
    annotation: [
        {type: 'confluence', description: '1308524937 complete'}, // Add annotation
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: SNAPSHOT});

    const authoring = new Authoring(page);
    const monitoring = new Monitoring(page);
    const headline = 'Annotation added';

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.createArticleFromDefaultTemplate();

    const headlineField = page.getByTestId('field--headline').getByRole('textbox');

    await expect(headlineField).toBeVisible();
    await headlineField.fill(headline);

    const body = await typeBody(page);
    const underlineColor = await getAnnotationUnderlineColor(body);
    const annotationButton = getAnnotationButton(body);
    const dialog = getAnnotationDialog(page);

    // the caret sits at the end of the text it just typed, so nothing is selected
    await expect(annotationButton).toHaveClass(/inactive/);

    await selectAnnotationTarget(page, body);
    await expect(annotationButton).not.toHaveClass(/inactive/);
    await annotationButton.click();

    await expect(getAnnotationBodyInput(dialog)).toBeVisible();
    await expect(dialog.getByTestId('annotation-type-select')).toHaveValue(FIRST_TYPE.qcode);
    await expect(dialog.getByTestId('submit')).toBeDisabled();

    await writeAnnotationBody(dialog, 'discarded by Cancel');
    await expect(dialog.getByTestId('submit')).toBeEnabled();

    await dialog.getByTestId('cancel').click();
    await expect(dialog).toHaveCount(0);
    await expectPlainRun(getEditor3TextRun(body, BODY_TEXT));

    await addAnnotation(page, body, ANNOTATION_TEXT);

    await expectAnnotatedRun(getEditor3TextRun(body, ANNOTATED_TEXT), underlineColor);
    await expectPlainRun(getEditor3TextRun(body, PLAIN_TEXT));

    const popup = await openAnnotationPopup(page, body);

    await expect(popup.getByTestId('annotation-type')).toHaveText(`Annotation type: ${SECOND_TYPE.name}`);
    await expect(popup.getByTestId('annotation-body')).toHaveText(ANNOTATION_TEXT);

    // clicking text that carries no annotation collapses the caret outside the highlight,
    // which is what closes the popup
    await getEditor3TextRun(body, PLAIN_TEXT).click();
    await expect(popup).toBeHidden();

    await authoring.closeAndSave();

    await monitoring.getArticleLocator(headline).dblclick();
    await expect(headlineField).toHaveText(headline);

    await expectAnnotatedRun(getEditor3TextRun(body, ANNOTATED_TEXT), underlineColor);
    await expectPlainRun(getEditor3TextRun(body, PLAIN_TEXT));

    await expectReopenedAnnotation(page, body, {type: SECOND_TYPE.name, message: ANNOTATION_TEXT});
});

test('editing an annotation from its preview, and the edit surviving a reopen', {
    annotation: [
        {type: 'confluence', description: '1311834884 complete'}, // Edit annotation
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: SNAPSHOT});

    const authoring = new Authoring(page);
    const monitoring = new Monitoring(page);
    const headline = 'Annotation edited';

    const body = await createArticleWithAnnotation(page, headline);
    const underlineColor = await getAnnotationUnderlineColor(body);
    const popup = await openAnnotationPopup(page, body);
    const dialog = getAnnotationDialog(page);
    const confirm = page.getByTestId('modal-confirm');

    await expectAnnotationPreview(popup, {type: SECOND_TYPE.name, message: ANNOTATION_TEXT});

    await executeAnnotationAction(popup, 'Edit');

    await expect(getAnnotationBodyInput(dialog)).toBeVisible();
    await expect(dialog.getByTestId('annotation-type-select')).toHaveValue(SECOND_TYPE.qcode);

    expect(await getEditor3FormattingOptions(getAnnotationBodyField(dialog)))
        .toEqual(['bold', 'italic', 'underline']);

    // Link is a SelectionButton, so it carries no formatting-option id; the shortcut is
    // part of the tooltip the accessible name comes from
    await expect(getAnnotationBodyField(dialog)
        .getByRole('button', {name: 'Link (Ctrl+K)', exact: true})).toBeVisible();

    await dialog.getByTestId('delete').click();
    await expect(confirm).toBeVisible();
    await expect(dialog).toHaveCount(0);

    await confirm.getByRole('button', {name: 'Cancel', exact: true}).click();
    await expect(confirm).toBeHidden();
    await expectAnnotatedRun(getEditor3TextRun(body, ANNOTATED_TEXT), underlineColor);

    await executeAnnotationAction(await openAnnotationPopup(page, body), 'Edit');

    await writeAnnotationBody(dialog, 'discarded edit');
    await dialog.getByTestId('cancel').click();
    await expect(dialog).toHaveCount(0);

    const keptPopup = await openAnnotationPopup(page, body);

    await expect(keptPopup.getByTestId('annotation-type')).toHaveText(`Annotation type: ${SECOND_TYPE.name}`);
    await expect(keptPopup.getByTestId('annotation-body')).toHaveText(ANNOTATION_TEXT);

    await executeAnnotationAction(keptPopup, 'Edit');

    await expect(getAnnotationBodyInput(dialog)).toBeVisible();
    await dialog.getByTestId('annotation-type-select').selectOption({label: FIRST_TYPE.name});
    await writeAnnotationBody(dialog, EDITED_ANNOTATION_TEXT);
    await getAnnotationBodyInput(dialog).press('ControlOrMeta+a');
    await getAnnotationBodyField(dialog).getByTestId('formatting-option')
        .and(page.locator('[data-test-value="bold"]')).click();

    await dialog.getByTestId('submit').click();
    await expect(dialog).toHaveCount(0);
    await expectAnnotatedRun(getEditor3TextRun(body, ANNOTATED_TEXT), underlineColor);

    const editedPopup = await openAnnotationPopup(page, body);

    await expect(editedPopup.getByTestId('annotation-type')).toHaveText(`Annotation type: ${FIRST_TYPE.name}`);
    await expect(editedPopup.getByTestId('annotation-body')).toHaveText(EDITED_ANNOTATION_TEXT);
    await expect(editedPopup.getByTestId('annotation-body').locator('b')).toHaveText(EDITED_ANNOTATION_TEXT);

    await authoring.closeAndSave();

    await monitoring.getArticleLocator(headline).dblclick();

    const headlineField = page.getByTestId('field--headline').getByRole('textbox');

    await expect(headlineField).toHaveText(headline);
    await expectAnnotatedRun(getEditor3TextRun(body, ANNOTATED_TEXT), underlineColor);
    await expectReopenedAnnotation(page, body, {type: FIRST_TYPE.name, message: EDITED_ANNOTATION_TEXT});
});

test('deleting an annotation through its confirmation dialog', {
    annotation: [
        {type: 'confluence', description: '1311834886 complete'}, // Delete annotation
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: SNAPSHOT});

    const authoring = new Authoring(page);
    const monitoring = new Monitoring(page);
    const headline = 'Annotation deleted';

    const body = await createArticleWithAnnotation(page, headline);
    const underlineColor = await getAnnotationUnderlineColor(body);
    const popup = await openAnnotationPopup(page, body);
    const confirm = page.getByTestId('modal-confirm');

    await expectAnnotationPreview(popup, {type: SECOND_TYPE.name, message: ANNOTATION_TEXT});

    await executeAnnotationAction(popup, 'Delete');
    await expect(confirm).toBeVisible();

    // the dialog's title is its accessible name; it is not rendered as a heading
    await expect(confirm).toHaveAccessibleName('Confirm');
    await expect(confirm).toContainText('The annotation will be deleted. Are you sure?');

    await confirm.getByRole('button', {name: 'Cancel', exact: true}).click();
    await expect(confirm).toBeHidden();
    await expectAnnotatedRun(getEditor3TextRun(body, ANNOTATED_TEXT), underlineColor);

    await executeAnnotationAction(await openAnnotationPopup(page, body), 'Delete');
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', {name: 'OK', exact: true}).click();

    await expect(confirm).toBeHidden();
    await expect(popup).toBeHidden();

    // the annotated word is no longer a leaf of its own once the highlight is gone
    await expectPlainRun(getEditor3TextRun(body, BODY_TEXT));

    await authoring.closeAndSave();

    await monitoring.getArticleLocator(headline).dblclick();

    const headlineField = page.getByTestId('field--headline').getByRole('textbox');

    await expect(headlineField).toHaveText(headline);

    // the underline is the annotation's only mark in the field, and the whole body being
    // one leaf again is what says no highlight splits it
    await expectPlainRun(getEditor3TextRun(body, BODY_TEXT));
});
