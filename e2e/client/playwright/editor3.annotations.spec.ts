import {Locator, Page, expect, test} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {pressRepeatedly, restoreDatabaseSnapshot} from './utils';
import {getEditor3Field, getEditor3FormattingOptions, getEditor3TextRun} from './utils/editor3';

/**
 * Editor3 annotations on the body field: add, edit from the preview, delete, each carried
 * through a save and a reopen. No profile in `main` enables the `annotation` formatting
 * option, so every test runs on the `editor3-annotations` record, which adds it to the Story
 * profile's body.
 *
 * Where the product differs from the QA cases the assertions follow the product: the popup
 * has no "Annotation preview" title, the type row is one string ("Annotation type: Regular"),
 * and the edit dialog's Delete button closes the dialog before the confirmation is answered
 * (`AnnotationInput.deleteAnnotation` does not wait on it). Link insertion in the annotation
 * body is not driven.
 */

/** Each test creates, saves and reopens an article, which does not fit the 30s default. */
test.describe.configure({timeout: 120000});

const SNAPSHOT = 'editor3-annotations';

/**
 * Split so the trailing word is selected with a fixed number of Shift+Arrow presses and each
 * half stays its own Draft.js leaf once the annotation splits the block.
 */
const PLAIN_TEXT = 'alpha';
const ANNOTATED_TEXT = 'bravo';
const BODY_TEXT = `${PLAIN_TEXT} ${ANNOTATED_TEXT}`;

const ANNOTATION_TEXT = 'first note on bravo';
const EDITED_ANNOTATION_TEXT = 'second note on bravo';

/** `annotation_types` entries in `main`, in its order; a new annotation starts on the first. */
const FIRST_TYPE = {name: 'Regular', qcode: 'regular'};
const SECOND_TYPE = {name: 'Remark', qcode: 'remark'};

/**
 * `SelectionButton` has no test id: the accessible name comes from the outer tooltip, the
 * click handler and the `inactive` class sit on the inner span.
 */
function getAnnotationButton(body: Locator): Locator {
    return body.getByTestId('toolbar')
        .getByRole('button', {name: 'Annotation', exact: true})
        .locator('span');
}

function getAnnotationDialog(page: Page): Locator {
    return page.getByTestId('annotation-input');
}

/** Rendered by `HighlightsPopup` into the global `#react-placeholder`, not inside the editor. */
function getAnnotationPopup(page: Page): Locator {
    return page.getByTestId('annotation');
}

/**
 * The underline is `var(--sd-editor-colour__adding)` (`highlightsConfig.ts`), defined per
 * editor theme and resolving to an `lch()` value, so it is read from a probe inside the field.
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

/** Selects the trailing word. The caret is walked with ArrowRight because End does not move it on macOS. */
async function selectAnnotationTarget(page: Page, body: Locator): Promise<void> {
    await getEditor3TextRun(body, ANNOTATED_TEXT).click();
    await pressRepeatedly(page, 'ArrowRight', BODY_TEXT.length);
    await pressRepeatedly(page, 'Shift+ArrowLeft', ANNOTATED_TEXT.length);
}

function getAnnotationBodyField(dialog: Locator): Locator {
    return dialog.getByTestId('annotation-body-input');
}

function getAnnotationBodyInput(dialog: Locator): Locator {
    return getAnnotationBodyField(dialog).getByRole('textbox');
}

/** `fill` does not apply to Draft.js, so the body is selected and typed over. */
async function writeAnnotationBody(dialog: Locator, message: string): Promise<void> {
    const input = getAnnotationBodyInput(dialog);

    await input.click();
    await input.press('ControlOrMeta+a');
    await input.pressSequentially(message);
    await expect(input).toHaveText(message);
}

/** Annotates the trailing word, typed as `SECOND_TYPE` so a non-default type gets stored. */
async function addAnnotation(page: Page, body: Locator, message: string): Promise<void> {
    const dialog = getAnnotationDialog(page);

    await selectAnnotationTarget(page, body);
    await expect(getAnnotationButton(body)).not.toHaveClass(/inactive/);
    await getAnnotationButton(body).click();

    await expect(getAnnotationBodyInput(dialog)).toBeVisible();

    // the dialog can reset the select to the seeded type right after opening
    const typeSelect = dialog.getByTestId('annotation-type-select');

    await expect(async () => {
        await typeSelect.selectOption({label: SECOND_TYPE.name});
        await expect(typeSelect).toHaveValue(SECOND_TYPE.qcode, {timeout: 1000});
    }).toPass({timeout: 10000});

    await writeAnnotationBody(dialog, message);
    await expect(typeSelect).toHaveValue(SECOND_TYPE.qcode);

    await dialog.getByTestId('submit').click();
    await expect(dialog).toHaveCount(0);
}

/**
 * On a freshly opened article a click on the annotated word only opens the popup once the
 * caret moves onto the highlight from elsewhere, hence the click on the plain half first.
 */
async function clickAnnotatedText(body: Locator): Promise<void> {
    await getEditor3TextRun(body, PLAIN_TEXT).click();
    await getEditor3TextRun(body, ANNOTATED_TEXT).click();
}

/**
 * Retried: `HighlightsPopup` unmounts the popup whenever a re-render finds the caret off a
 * highlight, and the field keeps re-rendering for a while after an edit.
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
 * For a reopened article: editor3 resets its selection once more while initializing, which
 * unmounts a popup that already came up, so the open is retried together with the assertions.
 */
async function expectReopenedAnnotation(
    page: Page,
    body: Locator,
    expected: {type: string; message: string; bold?: boolean},
): Promise<void> {
    const popup = getAnnotationPopup(page);

    await expect(async () => {
        await clickAnnotatedText(body);
        await expect(popup.getByTestId('annotation-type'))
            .toHaveText(`Annotation type: ${expected.type}`, {timeout: 2000});
        await expect(popup.getByTestId('annotation-body')).toHaveText(expected.message, {timeout: 2000});

        if (expected.bold === true) {
            await expect(popup.getByTestId('annotation-body').locator('b'))
                .toHaveText(expected.message, {timeout: 2000});
        }
    }).toPass({timeout: 30000});
}

/**
 * The popup is remounted and repositioned after every document click, so Playwright's
 * actionability checks report it unstable, then detached; a dispatched event only needs it
 * attached.
 */
function clickInPopup(target: Locator): Promise<void> {
    return target.dispatchEvent('click');
}

/** Matched on text: each entry renders an icon before its label and Chrome folds the glyph into the name. */
function getAnnotationAction(menu: Locator, action: string): Locator {
    return menu.getByRole('button').filter({hasText: action});
}

async function openAnnotationActions(popup: Locator): Promise<Locator> {
    const menu = popup.getByTestId('highlight-actions-menu');

    await clickInPopup(popup.getByTestId('highlight-actions-toggle'));
    await expect(menu).toBeVisible();

    return menu;
}

async function executeAnnotationAction(popup: Locator, action: string): Promise<void> {
    const menu = await openAnnotationActions(popup);

    await clickInPopup(getAnnotationAction(menu, action));
}

/** The "Annotation preview" expected results shared by the edit and delete cases. */
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
 * No snapshot ships an annotated article. The save is also where editor3 is known to have
 * handed its change to the authoring model.
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

    // a click outside the highlight closes the popup
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

    // Link is a SelectionButton without a formatting-option id; its name includes the shortcut
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
    await expectReopenedAnnotation(page, body, {type: FIRST_TYPE.name, message: EDITED_ANNOTATION_TEXT, bold: true});
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

    // closing before the deletion reaches the article model skips the "Save changes?" prompt
    await expect(page.getByTestId('authoring-topbar').getByTestId('save')).toBeEnabled();

    await authoring.closeAndSave();

    await monitoring.getArticleLocator(headline).dblclick();

    const headlineField = page.getByTestId('field--headline').getByRole('textbox');

    await expect(headlineField).toHaveText(headline);

    // the whole body being one leaf again says no highlight splits it
    await expectPlainRun(getEditor3TextRun(body, BODY_TEXT));
});
