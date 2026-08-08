import {test, expect, type Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {AttachmentsPane} from './page-object-models/attachments';
import {dismissSessionExpiry, login, restoreDatabaseSnapshot} from './utils';

/**
 * Article attachments: adding, downloading, editing, removing, and linking body text
 * to an attachment.
 *
 * Attachments are reachable from two entry points that render the same component:
 * the "Attachments" side widget and the content-profile `attachments` field. Every
 * operation below is therefore driven from both, and each test carries the case id
 * of both entry-point variants.
 *
 * Snapshots
 * ---------
 * The content-profile field only renders when the item's profile enables
 * `editor.attachments` and `schema.attachments` (article-edit.html gates the field on
 * both). No article in `main` can show it: every article and every create template
 * there uses the "Story" profile, which has both set to `null`. (`main` also ships the
 * stock "Text" profile, which does enable them, but nothing there uses it.) The
 * `legacy` dataset's "Plain text" profile enables the field and every text item there
 * uses it, so the two-entry-point tests run under `legacy`. The link test needs an
 * editor3 body toolbar, which "Plain text" does not have (`editor3: false`), so it
 * runs under `main`.
 *
 * Preconditions
 * -------------
 * No snapshot ships an article with attachments, so the "text item with several
 * attachments" precondition is built in-test through a single multi-file upload, the
 * same narrow exception `edit-embed.spec.ts` uses for its embed.
 *
 * Coverage notes
 * --------------
 * - "Add attachment" (1326285057, 1326285113) is `partial`. The *Remove file* icon in
 *   the Attach files dialog is asserted to be present, but not that it "removes the
 *   file from the dialog": it cannot, because `UploadAttachmentsModal.cancelItem`
 *   spreads the items array into an object literal (`{...prevState.items}`) and then
 *   calls `splice` on it, which throws `TypeError` and unmounts the dialog. Fixing
 *   that is a product change and out of scope for a test-only branch.
 * - "All file types can be added as attachments" is unbounded; it is covered by
 *   sampling two unrelated types (a plain-text file and a JPEG).
 * - The dialog's Upload button is documented as gated on required Title and
 *   Description. The product gates it on the *first* file's Title and Description
 *   only (`disableUploadButton` reads `items[0]`), so that is what is asserted.
 * - The edit dialog's confirm button is labelled "Update", not "Save" as the case
 *   says; the product's label is asserted.
 * - The internal marker's text is "internal", uppercased by the label style rather
 *   than written as "Internal"; the assertion is case-insensitive on the real text.
 * - "Attachments in NINJS output" (1326285069) is parked, not covered here: no
 *   snapshot carries a subscriber whose destination format is NINJS ("Subscriber 1"
 *   in `main` is the only one and it formats as `email`), so neither expected result
 *   ("only public attachments are sent", "internal attachments are not sent out") is
 *   reachable. It needs a NINJS subscriber in a fixture first.
 */

// Every test builds its own attachments through the upload dialog and most of them
// also save, close and reopen the article, which does not fit the 30s default.
test.setTimeout(120000);

const TEXT_FILE = 'not-a-media-file.txt';
const TEXT_FILE_SIZE = '17';
const IMAGE_FILE = 'image-blue.jpg';
const SECOND_IMAGE_FILE = 'image-green.jpg';

const PUBLIC_ATTACHMENT = {
    file: TEXT_FILE,
    title: 'Public doc',
    description: 'a public attachment',
};

const INTERNAL_ATTACHMENT = {
    file: IMAGE_FILE,
    title: 'Internal pic',
    description: 'an internal attachment',
    internal: true,
};

interface IOpenedArticle {
    authoring: Authoring;
    /** the "Attachments" side widget; only usable after `useWidget()` */
    widget: AttachmentsPane;
    /** the content-profile `attachments` field; only usable after `useField()` */
    field: AttachmentsPane;
    /**
     * The side widget panel is an overlay that covers the part of the article the
     * content-profile field sits in, so only one of the two entry points is reachable
     * at a time and a test switches between them with these.
     */
    useWidget(): Promise<void>;
    useField(): Promise<void>;
}

/**
 * Opens the `legacy` article that carries the content-profile attachments field and
 * returns a handle on each entry point. Both render the same component and stay in
 * sync: every mutation dispatches a custom event that both instances listen to.
 */
async function openArticle(page: Page): Promise<IOpenedArticle> {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Politic Desk');

    await monitoring.executeActionOnMonitoringItem(
        page.getByTestId('article-item').and(page.locator('[data-test-value="item5"]')).first(),
        'Edit',
    );

    const fieldLocator = page.getByTestId('authoring')
        .getByTestId('authoring-field')
        .and(page.locator('[data-test-value="attachments"]'));

    await expect(fieldLocator).toBeVisible();

    const widgetPanel = page.getByTestId('authoring-widget-panel')
        .and(page.locator('[data-test-value="Attachments"]'));

    return {
        authoring,
        widget: new AttachmentsPane(widgetPanel.getByTestId('attachments-pane')),
        field: new AttachmentsPane(fieldLocator.getByTestId('attachments-pane')),
        useWidget: () => authoring.openWidget('Attachments').then(() => undefined),
        useField: () => authoring.closeWidget('Attachments'),
    };
}

/** Saves and reopens the article, so an assertion after it reads persisted state. */
async function saveCloseAndReopen(page: Page, authoring: Authoring): Promise<IOpenedArticle> {
    await authoring.save();
    await dismissSessionExpiry(page);
    await authoring.close();
    await dismissSessionExpiry(page);

    return openArticle(page);
}

test.describe('article attachments', () => {
    test.use({storageState: {cookies: [], origins: []}});

    test.beforeEach(async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'legacy'});
        await login(page);
    });

    test('attach files from the widget and from the content profile field', {
        annotation: [
            {type: 'confluence', description: '1326285057 partial'}, // Add attachment from right toolbar
            {type: 'confluence', description: '1326285113 partial'}, // Add attachment from content profile field
        ],
    }, async ({page}) => {
        const {widget, field, useWidget, useField} = await openArticle(page);

        await useWidget();
        await widget.openUploadDialog([TEXT_FILE, IMAGE_FILE]);

        await expect(widget.uploadDialog.getByTestId('upload-attachment')).toHaveCount(2);

        const textCard = widget.uploadCard(TEXT_FILE);

        await expect(textCard.getByTestId('file-preview')).toBeVisible();
        await expect(textCard.getByTestId('file-preview').getByTestId('remove-file')).toBeVisible();
        await expect(textCard.getByTestId('filename')).toHaveValue(TEXT_FILE);
        await expect(textCard.getByTestId('filename')).toBeDisabled();
        await expect(textCard.getByTestId('filesize')).toHaveValue(TEXT_FILE_SIZE);
        await expect(textCard.getByTestId('filesize')).toBeDisabled();

        const uploadButton = widget.uploadDialog.getByTestId('upload');

        await expect(uploadButton).toBeDisabled();
        await textCard.getByTestId('title').fill(PUBLIC_ATTACHMENT.title);
        await expect(uploadButton).toBeDisabled();
        await textCard.getByTestId('description').fill(PUBLIC_ATTACHMENT.description);
        await expect(uploadButton).toBeEnabled();

        await widget.uploadDialog.getByTestId('cancel').click();
        await expect(widget.uploadDialog).toBeHidden();
        // anchor the emptiness assertion on a control that only the rendered pane has
        await expect(widget.root.getByTestId('attach-files')).toBeVisible();
        await expect(widget.list.getByTestId('attachment-title')).toHaveCount(0);

        await widget.attach([PUBLIC_ATTACHMENT, INTERNAL_ATTACHMENT]);

        await expect(widget.filename(PUBLIC_ATTACHMENT.title))
            .toHaveText(`${TEXT_FILE} (${TEXT_FILE_SIZE} b)`);
        await expect(widget.description(PUBLIC_ATTACHMENT.title))
            .toHaveText(PUBLIC_ATTACHMENT.description);
        await expect(widget.internalLabel(INTERNAL_ATTACHMENT.title)).toHaveText(/internal/i);
        await expect(widget.internalLabel(PUBLIC_ATTACHMENT.title)).toHaveCount(0);

        await useField();

        // the widget upload is listed by the field as well
        await expect(field.title(PUBLIC_ATTACHMENT.title)).toBeVisible();
        await expect(field.title(INTERNAL_ATTACHMENT.title)).toBeVisible();

        const fieldAttachment = {
            file: SECOND_IMAGE_FILE,
            title: 'Field doc',
            description: 'added from the content profile field',
        };

        await field.attach([fieldAttachment]);

        const droppedAttachment = {
            file: 'dropped.txt',
            title: 'Dropped doc',
            description: 'added by dropping a file on the field',
        };

        await field.dropFiles([{name: droppedAttachment.file, content: 'dropped', type: 'text/plain'}]);
        await field.fillUploadCard(droppedAttachment);
        await field.confirmUpload([droppedAttachment]);

        await expect(field.list.getByTestId('attachment-title')).toHaveCount(4);

        await useWidget();

        await expect(widget.title(fieldAttachment.title)).toBeVisible();
        await expect(widget.title(droppedAttachment.title)).toBeVisible();
        await expect(widget.list.getByTestId('attachment-title')).toHaveCount(4);
    });

    test('download attachments from the widget and from the content profile field', {
        annotation: [
            {type: 'confluence', description: '1327759365 complete'}, // Download attachment using the right toolbar
            // Download attachment using the content profile field
            {type: 'confluence', description: '1326285061 complete'},
        ],
    }, async ({page}) => {
        const opened = await openArticle(page);

        await opened.useWidget();
        await opened.widget.attach([PUBLIC_ATTACHMENT, INTERNAL_ATTACHMENT]);

        // `attachmentsApi.download` opens the stored file in a new tab; the url is the
        // backend's raw-media endpoint scoped to the attachments resource.
        const downloadUrl = /\/upload-raw\/[^/?]+\?resource=attachments$/;

        async function downloadEach(pane: AttachmentsPane): Promise<void> {
            for (const attachment of [PUBLIC_ATTACHMENT, INTERNAL_ATTACHMENT]) {
                await pane.hoverItem(attachment.title);
                await expect(pane.downloadButton(attachment.title)).toHaveAttribute('title', 'Download');

                const popup = await pane.download(attachment.title);

                // the popup event can arrive before the tab committed its target url
                await expect.poll(() => popup.url()).toMatch(downloadUrl);
                await popup.close();
            }
        }

        await downloadEach(opened.widget);

        await opened.useField();
        await downloadEach(opened.field);

        const reopened = await saveCloseAndReopen(page, opened.authoring);

        await reopened.useWidget();
        await expect(reopened.widget.title(PUBLIC_ATTACHMENT.title)).toBeVisible();
        await expect(reopened.widget.title(INTERNAL_ATTACHMENT.title)).toBeVisible();

        await reopened.useField();
        await expect(reopened.field.title(PUBLIC_ATTACHMENT.title)).toBeVisible();
        await expect(reopened.field.title(INTERNAL_ATTACHMENT.title)).toBeVisible();
    });

    test('edit attachments from the widget and from the content profile field', {
        annotation: [
            {type: 'confluence', description: '1326285123 complete'}, // Edit attachment using the right toolbar
            {type: 'confluence', description: '1326285121 complete'}, // Edit attachment using the content profile field
        ],
    }, async ({page}) => {
        const opened = await openArticle(page);

        await opened.useWidget();
        await opened.widget.attach([PUBLIC_ATTACHMENT, INTERNAL_ATTACHMENT]);

        const editDialog = opened.widget.editDialog;

        await opened.widget.openEditDialog(PUBLIC_ATTACHMENT.title);

        await expect(editDialog.getByTestId('title')).toHaveValue(PUBLIC_ATTACHMENT.title);
        await expect(editDialog.getByTestId('description')).toHaveValue(PUBLIC_ATTACHMENT.description);

        // the dialog offers no internal/public control, so that status cannot be changed
        await expect(editDialog.getByRole('checkbox')).toHaveCount(0);

        await editDialog.getByTestId('title').fill('discarded title');
        await editDialog.getByTestId('description').fill('discarded description');
        await opened.widget.cancelEdit();

        await expect(opened.widget.title(PUBLIC_ATTACHMENT.title)).toBeVisible();
        await expect(opened.widget.description(PUBLIC_ATTACHMENT.title))
            .toHaveText(PUBLIC_ATTACHMENT.description);

        const editedPublic = {title: 'Public doc edited', description: 'edited from the widget'};

        await opened.widget.openEditDialog(PUBLIC_ATTACHMENT.title);
        await editDialog.getByTestId('title').fill(editedPublic.title);
        await editDialog.getByTestId('description').fill(editedPublic.description);
        await opened.widget.confirmEdit();

        await expect(opened.widget.title(editedPublic.title)).toBeVisible();
        await expect(opened.widget.description(editedPublic.title)).toHaveText(editedPublic.description);

        const editedInternal = {title: 'Internal pic edited', description: 'edited from the field'};

        await opened.useField();
        await opened.field.openEditDialog(INTERNAL_ATTACHMENT.title);
        await editDialog.getByTestId('title').fill(editedInternal.title);
        await editDialog.getByTestId('description').fill(editedInternal.description);
        await opened.field.confirmEdit();

        await expect(opened.field.title(editedInternal.title)).toBeVisible();
        await expect(opened.field.description(editedInternal.title)).toHaveText(editedInternal.description);
        await expect(opened.field.internalLabel(editedInternal.title)).toHaveText(/internal/i);

        const reopened = await saveCloseAndReopen(page, opened.authoring);

        async function expectEditsPersisted(pane: AttachmentsPane): Promise<void> {
            await expect(pane.title(editedPublic.title)).toBeVisible();
            await expect(pane.description(editedPublic.title)).toHaveText(editedPublic.description);
            await expect(pane.title(editedInternal.title)).toBeVisible();
            await expect(pane.description(editedInternal.title)).toHaveText(editedInternal.description);
            await expect(pane.internalLabel(editedInternal.title)).toHaveText(/internal/i);
            await expect(pane.internalLabel(editedPublic.title)).toHaveCount(0);
        }

        await reopened.useWidget();
        await expectEditsPersisted(reopened.widget);

        await reopened.useField();
        await expectEditsPersisted(reopened.field);
    });

    test('remove attachments from the widget and from the content profile field', {
        annotation: [
            {type: 'confluence', description: '1326285063 complete'}, // Remove attachment using the right toolbar
            // Remove attachment using the content profile field
            {type: 'confluence', description: '1326285117 complete'},
        ],
    }, async ({page}) => {
        const opened = await openArticle(page);

        const keptAttachment = {
            file: SECOND_IMAGE_FILE,
            title: 'Kept doc',
            description: 'stays on the item',
        };

        await opened.useWidget();
        await opened.widget.attach([PUBLIC_ATTACHMENT, INTERNAL_ATTACHMENT, keptAttachment]);

        await expect(opened.widget.list.getByTestId('attachment-title')).toHaveCount(3);
        await expect(opened.widget.removeButton(PUBLIC_ATTACHMENT.title))
            .toHaveAttribute('title', 'Remove');

        await opened.widget.remove(PUBLIC_ATTACHMENT.title);

        await expect(opened.widget.title(keptAttachment.title)).toBeVisible();
        await expect(opened.widget.list.getByTestId('attachment-title')).toHaveCount(2);

        await opened.useField();

        await expect(opened.field.title(keptAttachment.title)).toBeVisible();
        await expect(opened.field.title(INTERNAL_ATTACHMENT.title)).toBeVisible();
        await expect(opened.field.title(PUBLIC_ATTACHMENT.title)).toHaveCount(0);

        await opened.field.remove(INTERNAL_ATTACHMENT.title);

        await expect(opened.field.title(keptAttachment.title)).toBeVisible();
        await expect(opened.field.list.getByTestId('attachment-title')).toHaveCount(1);

        const reopened = await saveCloseAndReopen(page, opened.authoring);

        await reopened.useWidget();
        await expect(reopened.widget.title(keptAttachment.title)).toBeVisible();
        await expect(reopened.widget.list.getByTestId('attachment-title')).toHaveCount(1);

        await reopened.useField();
        await expect(reopened.field.title(keptAttachment.title)).toBeVisible();
        await expect(reopened.field.list.getByTestId('attachment-title')).toHaveCount(1);
    });
});

test.describe('linking article body text to an attachment', () => {
    test('the link dialog lists public attachments only and inserts a link that persists', {
        annotation: [
            {type: 'confluence', description: '1326285066 complete'}, // Link to attachment
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.getArticleLocator('test sports story').dblclick();

        const widget = new AttachmentsPane(
            (await authoring.openWidget('Attachments')).getByTestId('attachments-pane'),
        );

        await widget.attach([PUBLIC_ATTACHMENT, INTERNAL_ATTACHMENT]);

        // the widget panel overlays the article body, so it has to go before the body
        // field can be reached
        await authoring.closeWidget('Attachments');

        const body = page.getByTestId('authoring')
            .getByTestId('authoring-field')
            .and(page.locator('[data-test-value="body_html"]'));

        const discardedText = 'discarded link';
        const linkText = 'attachment link';

        /**
         * Types text at the caret and leaves exactly those characters selected, which
         * is what the link toolbar button acts on. Home/End are not usable here: they
         * move by *visual* line, so where the paragraph wraps decides how much of the
         * pre-existing body text ends up in the selection.
         */
        async function typeAndSelect(text: string): Promise<void> {
            await body.getByRole('textbox').click();
            await page.keyboard.type(text);

            for (let i = 0; i < text.length; i++) {
                await page.keyboard.press('Shift+ArrowLeft');
            }
        }

        await typeAndSelect(discardedText);

        const linkButton = body.getByTestId('toolbar').getByRole('button', {name: 'Link (Ctrl+K)'});

        // SelectionButton marks itself inactive while the selection is collapsed and
        // ignores clicks then, so the selection above is what makes the link reachable.
        // The `inactive` class sits on the inner span that carries the click handler,
        // not on the outer element that carries the role and the label.
        await expect(linkButton.locator('> span')).not.toHaveClass(/inactive/);
        await linkButton.click();

        await expect(page.getByTestId('link-url').getByRole('textbox')).toBeVisible();

        await page.getByRole('button', {name: 'Attachment', exact: true}).click();

        const attachmentTab = page.getByTestId('link-attachments');
        const publicRow = attachmentTab.getByTestId('link-attachment-item')
            .and(page.locator(`[data-test-value="${PUBLIC_ATTACHMENT.title}"]`));

        await expect(publicRow).toBeVisible();
        await expect(
            attachmentTab.getByTestId('link-attachment-item')
                .and(page.locator(`[data-test-value="${INTERNAL_ATTACHMENT.title}"]`)),
        ).toHaveCount(0);

        await expect(attachmentTab.getByTestId('insert')).toBeDisabled();
        await publicRow.click();
        await expect(attachmentTab.getByTestId('insert')).toBeEnabled();

        await attachmentTab.getByTestId('cancel').click();
        await expect(attachmentTab).toBeHidden();
        await expect(body.getByRole('textbox')).toBeVisible();
        await expect(body.locator('a[data-attachment]')).toHaveCount(0);

        await typeAndSelect(linkText);
        await linkButton.click();
        await page.getByRole('button', {name: 'Attachment', exact: true}).click();
        await publicRow.click();
        await attachmentTab.getByTestId('insert').click();

        await expect(attachmentTab).toBeHidden();

        const insertedLink = body.locator('a[data-attachment]');

        await expect(insertedLink).toHaveText(linkText);
        await expect(insertedLink).toHaveAttribute('title', PUBLIC_ATTACHMENT.title);

        await authoring.save();
        await authoring.close();

        await monitoring.getArticleLocator('test sports story').dblclick();

        await expect(body.locator('a[data-attachment]')).toHaveText(linkText);
        await expect(body.locator('a[data-attachment]'))
            .toHaveAttribute('title', PUBLIC_ATTACHMENT.title);
    });
});

/*
 * Placeholder so the parked case of this batch is machine-readable next to the ones
 * that are covered, instead of living only in the file docstring. See that docstring
 * for why it cannot be asserted.
 */
test.fixme('attachments in NINJS output', {
    annotation: [
        {type: 'confluence', description: '1326285069 blocker'}, // Attachments in NINJS output
    ],
}, async () => {
    // No snapshot carries a subscriber whose destination format is NINJS.
});
