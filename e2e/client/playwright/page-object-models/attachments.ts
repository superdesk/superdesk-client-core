import {expect, Locator, Page} from '@playwright/test';
import path from 'path';

export interface IAttachmentUpload {
    /** file name under `e2e/client/test-files` */
    file: string;
    title: string;
    description: string;
    internal?: boolean;
}

export interface IDroppedFile {
    name: string;
    content: string;
    type: string;
}

/**
 * Drives one attachments pane.
 *
 * `AttachmentsWidgetComponent` renders the same pane in both places attachments are
 * reachable from: the "Attachments" side widget and the content-profile `attachments`
 * field. Only the `isWidget` flag differs, and it changes nothing but the look of the
 * control that opens the file picker, so both entry points share this object and only
 * the root locator differs.
 *
 * The upload and edit dialogs are portalled to `document.body`, so they are addressed
 * from the page rather than from the pane.
 */
export class AttachmentsPane {
    readonly root: Locator;
    private readonly page: Page;

    constructor(root: Locator) {
        this.root = root;
        this.page = root.page();
    }

    get list(): Locator {
        return this.root.getByTestId('attachments-list');
    }

    get uploadDialog(): Locator {
        return this.page.getByTestId('attach-files-modal');
    }

    get editDialog(): Locator {
        return this.page.getByTestId('edit-attachment-modal');
    }

    /**
     * A row carries no test id of its own: `AttachmentsListItem` renders through the
     * shared List `Item` component, which forwards only the props it declares and so
     * drops a `data-test-id`. Every control and text node inside a row therefore
     * repeats the attachment title in `data-test-value`, and a row part is addressed
     * by that value instead of by chaining from a row.
     */
    private part(testId: string, attachmentTitle: string): Locator {
        return this.list
            .getByTestId(testId)
            .and(this.page.locator(`[data-test-value="${attachmentTitle}"]`));
    }

    title(attachmentTitle: string): Locator {
        return this.part('attachment-title', attachmentTitle);
    }

    filename(attachmentTitle: string): Locator {
        return this.part('attachment-filename', attachmentTitle);
    }

    description(attachmentTitle: string): Locator {
        return this.part('attachment-description', attachmentTitle);
    }

    internalLabel(attachmentTitle: string): Locator {
        return this.part('attachment-internal-label', attachmentTitle);
    }

    downloadButton(attachmentTitle: string): Locator {
        return this.part('attachment-download', attachmentTitle);
    }

    editButton(attachmentTitle: string): Locator {
        return this.part('attachment-edit', attachmentTitle);
    }

    removeButton(attachmentTitle: string): Locator {
        return this.part('attachment-remove', attachmentTitle);
    }

    titles(): Promise<Array<string>> {
        return this.list.getByTestId('attachment-title').allInnerTexts();
    }

    /** One card of the Attach files dialog, addressed by the file it was opened with. */
    uploadCard(file: string): Locator {
        return this.uploadDialog
            .getByTestId('upload-attachment')
            .and(this.page.locator(`[data-test-value="${file}"]`));
    }

    /**
     * Clicks the control that opens the file picker and hands it the given fixture
     * files. Going through the file chooser rather than setting the input directly
     * also covers the "dialog for uploading files from your computer is displayed"
     * step: `waitForEvent('filechooser')` only resolves once the browser opened one.
     */
    async openUploadDialog(files: Array<string>): Promise<void> {
        const [fileChooser] = await Promise.all([
            this.page.waitForEvent('filechooser'),
            this.root.getByTestId('attach-files').click(),
        ]);

        await fileChooser.setFiles(files.map((file) => path.join('test-files', file)));

        await expect(this.uploadDialog).toBeVisible();
    }

    /**
     * Drops files onto the pane. The drop handler reads `event.dataTransfer.files`,
     * so the files are built in the page and handed over as a `DataTransfer`.
     */
    async dropFiles(files: Array<IDroppedFile>): Promise<void> {
        const dataTransfer = await this.page.evaluateHandle((droppedFiles: Array<IDroppedFile>) => {
            const transfer = new DataTransfer();

            for (const file of droppedFiles) {
                transfer.items.add(new File([file.content], file.name, {type: file.type}));
            }

            return transfer;
        }, files);

        await this.root.dispatchEvent('drop', {dataTransfer});

        await expect(this.uploadDialog).toBeVisible();
    }

    async fillUploadCard(upload: IAttachmentUpload): Promise<void> {
        const card = this.uploadCard(upload.file);

        await card.getByTestId('title').fill(upload.title);
        await card.getByTestId('description').fill(upload.description);

        if (upload.internal === true) {
            // The Internal switch has no accessible name: its <label for> points at a
            // <span role="checkbox">, and a span is not a labelable element, so the
            // label never names it. There is one switch per card, so the role alone
            // identifies it within the card.
            await card.getByRole('checkbox').click();
        }
    }

    /**
     * Confirms the dialog and waits for every file to be stored and listed. The
     * dialog only closes once all uploads resolved, and the rows are rendered from
     * their responses, so the listed titles are the completion signal.
     */
    async confirmUpload(uploads: Array<IAttachmentUpload>): Promise<void> {
        await this.uploadDialog.getByTestId('upload').click();

        await expect(this.uploadDialog).toBeHidden();

        for (const upload of uploads) {
            await expect(this.title(upload.title)).toBeVisible();
        }
    }

    /** Picks the files, fills every card and uploads them. */
    async attach(uploads: Array<IAttachmentUpload>): Promise<void> {
        await this.openUploadDialog(uploads.map((upload) => upload.file));

        for (const upload of uploads) {
            await this.fillUploadCard(upload);
        }

        await this.confirmUpload(uploads);
    }

    /**
     * Hovers a row so its action menu is reachable. Until the row is hovered the menu
     * is laid out at `width: 0` with `overflow: hidden`, so a click on one of its
     * buttons lands on whatever clips it.
     */
    async hoverItem(attachmentTitle: string): Promise<void> {
        await this.title(attachmentTitle).hover();
    }

    /**
     * Downloads an attachment and returns the tab it opened. `attachmentsApi.download`
     * calls `window.open(url, '_blank')`, which surfaces as a popup.
     */
    async download(attachmentTitle: string): Promise<Page> {
        await this.hoverItem(attachmentTitle);

        const [popup] = await Promise.all([
            this.page.waitForEvent('popup'),
            this.downloadButton(attachmentTitle).click(),
        ]);

        return popup;
    }

    async openEditDialog(attachmentTitle: string): Promise<void> {
        await this.hoverItem(attachmentTitle);
        await this.editButton(attachmentTitle).click();

        await expect(this.editDialog).toBeVisible();
    }

    /**
     * Confirms the edit dialog and asserts the attachment PATCH succeeded. The dialog
     * is closed from the save callback only after that request resolved, so waiting on
     * the response buys the status check rather than the synchronisation.
     */
    async confirmEdit(): Promise<void> {
        const [response] = await Promise.all([
            this.page.waitForResponse(
                (res) => /\/attachments\/[^/]+$/.test(new URL(res.url()).pathname)
                    && res.request().method() === 'PATCH',
            ),
            this.editDialog.getByTestId('update').click(),
        ]);

        expect(response.status()).toBe(200);

        await expect(this.editDialog).toBeHidden();
    }

    async cancelEdit(): Promise<void> {
        await this.editDialog.getByTestId('cancel').click();

        await expect(this.editDialog).toBeHidden();
    }

    /**
     * Removes an attachment from the item. This only drops the reference from the
     * article, so the change is not persisted until the article itself is saved.
     */
    async remove(attachmentTitle: string): Promise<void> {
        await this.hoverItem(attachmentTitle);
        await this.removeButton(attachmentTitle).click();

        await expect(this.title(attachmentTitle)).toHaveCount(0);
    }
}
