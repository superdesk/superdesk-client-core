import {test, expect, type Page} from '@playwright/test';
import fs from 'fs';
import path from 'path';
import {AuthoringReact} from './page-object-models/authoring-react';
import {Monitoring} from './page-object-models/monitoring';
import {AttachmentsPane} from './page-object-models/attachments';
import {getCellValueByColumTitle, restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

/**
 * Attachment QA cases on authoring-react. The pane is the same `AttachmentsWidgetComponent`
 * angular renders, so the upload and edit dialog details are covered by
 * `article-attachments.spec.ts`; these tests cover what authoring-react owns: both entry points
 * (the "Attachments" side widget and the content-profile `attachments` field) staying in sync,
 * and the attachments reaching the saved, published and linked item.
 *
 * The angular spec reaches the `attachments` field through `legacy`'s "Plain text" profile. Here
 * "test sports story" is moved to `main`'s stock "Text" profile instead, the only `main` profile
 * that enables the field.
 */
test.use({storageState: getStorageState({}, {authoringReact: true})});

test.setTimeout(90000);

const TEXT_FILE = 'not-a-media-file.txt';
const IMAGE_FILE = 'image-blue.jpg';
const SECOND_IMAGE_FILE = 'image-green.jpg';

const PUBLIC_ATTACHMENT = {file: TEXT_FILE, title: 'Public doc', description: 'a public attachment'};

const INTERNAL_ATTACHMENT = {
    file: IMAGE_FILE,
    title: 'Internal pic',
    description: 'an internal attachment',
    internal: true,
};

interface IOpenedArticle {
    authoring: AuthoringReact;
    widget: AttachmentsPane;
    field: AttachmentsPane;
    // the widget panel overlays the part of the article the field sits in
    useWidget(): Promise<void>;
    useField(): Promise<void>;
}

const TEXT_PROFILE_ID = 'text';

async function openArticleWithAttachmentsField(page: Page): Promise<IOpenedArticle> {
    const monitoring = new Monitoring(page);
    const authoring = new AuthoringReact(page);
    const panel = page.getByTestId('authoring-widget-panel');
    const profileSelect = page.getByTestId('content-profile-select');

    await monitoring.openMonitoringForDesk('Sports');
    await monitoring.editItem(monitoring.getArticleLocator('test sports story'), profileSelect);
    await authoring.waitForAuthoringReactToInitialize();

    if (await profileSelect.getAttribute('data-test-value') !== TEXT_PROFILE_ID) {
        await profileSelect.selectOption(TEXT_PROFILE_ID);
    }

    const fieldLocator = authoring.fieldContainer('attachments');

    await expect(fieldLocator).toBeVisible();

    return {
        authoring,
        widget: new AttachmentsPane(panel.getByTestId('attachments-pane')),
        field: new AttachmentsPane(fieldLocator.getByTestId('attachments-pane')),
        useWidget: async () => {
            await authoring.openWidgetByIcon('attachments');
            await expect(panel.getByTestId('attachments-pane')).toBeVisible();
        },
        useField: async () => {
            if (await panel.isVisible()) {
                await authoring.widgetTab('attachments').click();
            }

            await expect(panel).toBeHidden();
        },
    };
}

async function saveCloseAndReopen(page: Page, authoring: AuthoringReact): Promise<IOpenedArticle> {
    await authoring.saveAndClose();

    return openArticleWithAttachmentsField(page);
}

test.describe('article attachments (authoring-react)', () => {
    test.beforeEach(async () => {
        await restoreDatabaseSnapshot();
    });

    test('files attached from the widget and from the field are listed by both and saved', {
        annotation: [
            {type: 'confluence', description: '1326285057 partial'}, // Add attachment from right toolbar
            {type: 'confluence', description: '1326285113 partial'}, // Add attachment from content profile field
        ],
    }, async ({page}) => {
        const opened = await openArticleWithAttachmentsField(page);
        const fieldAttachment = {file: SECOND_IMAGE_FILE, title: 'Field doc', description: 'added from the field'};

        await opened.useWidget();
        await opened.widget.attach([PUBLIC_ATTACHMENT, INTERNAL_ATTACHMENT]);

        await expect(opened.widget.filename(PUBLIC_ATTACHMENT.title)).toHaveText(`${TEXT_FILE} (17 b)`);
        await expect(opened.widget.internalLabel(INTERNAL_ATTACHMENT.title)).toHaveText(/internal/i);
        await expect(opened.widget.internalLabel(PUBLIC_ATTACHMENT.title)).toHaveCount(0);

        await opened.useField();
        await expect(opened.field.title(PUBLIC_ATTACHMENT.title)).toBeVisible();
        await expect(opened.field.title(INTERNAL_ATTACHMENT.title)).toBeVisible();

        await opened.field.attach([fieldAttachment]);
        await expect(opened.field.list.getByTestId('attachment-title')).toHaveCount(3);

        await opened.useWidget();
        await expect(opened.widget.title(fieldAttachment.title)).toBeVisible();
        await expect(opened.widget.list.getByTestId('attachment-title')).toHaveCount(3);

        const reopened = await saveCloseAndReopen(page, opened.authoring);

        await expect(reopened.field.list.getByTestId('attachment-title')).toHaveCount(3);
        await reopened.useWidget();
        await expect(reopened.widget.list.getByTestId('attachment-title')).toHaveCount(3);
    });

    test('the Download action of the widget and of the field serves the uploaded file', {
        annotation: [
            {type: 'confluence', description: '1327759365 partial'}, // Download attachment using the right toolbar
            {type: 'confluence', description: '1326285061 partial'}, // Download attachment using the field
        ],
    }, async ({page}) => {
        const opened = await openArticleWithAttachmentsField(page);

        await opened.useWidget();
        await opened.widget.attach([PUBLIC_ATTACHMENT]);

        async function expectDownload(pane: AttachmentsPane): Promise<void> {
            await pane.hoverAndExpectAction(PUBLIC_ATTACHMENT.title, pane.downloadButton(PUBLIC_ATTACHMENT.title));

            const popup = await pane.download(PUBLIC_ATTACHMENT.title);

            // the popup event can arrive before the tab committed its target url
            await expect.poll(() => popup.url()).toMatch(/\/upload-raw\/[^/?]+\?resource=attachments$/);

            const served = await page.request.get(popup.url());

            expect(served.ok()).toBe(true);
            expect(await served.body()).toEqual(fs.readFileSync(path.join('test-files', PUBLIC_ATTACHMENT.file)));

            await popup.close();
        }

        await expectDownload(opened.widget);

        await opened.useField();
        await expectDownload(opened.field);
    });

    test('an attachment edited from the widget and one edited from the field keep their edits', {
        annotation: [
            {type: 'confluence', description: '1326285123 complete'}, // Edit attachment using the right toolbar
            {type: 'confluence', description: '1326285121 complete'}, // Edit attachment using the field
        ],
    }, async ({page}) => {
        const opened = await openArticleWithAttachmentsField(page);
        const editDialog = opened.widget.editDialog;
        const editedPublic = {title: 'Public doc edited', description: 'edited from the widget'};
        const editedInternal = {title: 'Internal pic edited', description: 'edited from the field'};

        await opened.useWidget();
        await opened.widget.attach([PUBLIC_ATTACHMENT, INTERNAL_ATTACHMENT]);

        await opened.widget.openEditDialog(PUBLIC_ATTACHMENT.title);
        await expect(editDialog.getByTestId('title')).toHaveValue(PUBLIC_ATTACHMENT.title);
        await editDialog.getByTestId('title').fill('discarded title');
        await opened.widget.cancelEdit();
        await expect(opened.widget.title(PUBLIC_ATTACHMENT.title)).toBeVisible();

        await opened.widget.openEditDialog(PUBLIC_ATTACHMENT.title);
        await editDialog.getByTestId('title').fill(editedPublic.title);
        await editDialog.getByTestId('description').fill(editedPublic.description);
        await opened.widget.confirmEdit();
        await expect(opened.widget.description(editedPublic.title)).toHaveText(editedPublic.description);

        await opened.useField();
        await expect(opened.field.title(editedPublic.title)).toBeVisible();

        await opened.field.openEditDialog(INTERNAL_ATTACHMENT.title);
        await editDialog.getByTestId('title').fill(editedInternal.title);
        await editDialog.getByTestId('description').fill(editedInternal.description);
        await opened.field.confirmEdit();
        await expect(opened.field.description(editedInternal.title)).toHaveText(editedInternal.description);

        const reopened = await saveCloseAndReopen(page, opened.authoring);

        async function expectEditsPersisted(pane: AttachmentsPane): Promise<void> {
            await expect(pane.description(editedPublic.title)).toHaveText(editedPublic.description);
            await expect(pane.description(editedInternal.title)).toHaveText(editedInternal.description);
            await expect(pane.internalLabel(editedInternal.title)).toHaveText(/internal/i);
        }

        await expectEditsPersisted(reopened.field);
        await reopened.useWidget();
        await expectEditsPersisted(reopened.widget);
    });

    test('an attachment removed from the widget and one removed from the field stay removed', {
        annotation: [
            {type: 'confluence', description: '1326285063 complete'}, // Remove attachment using the right toolbar
            {type: 'confluence', description: '1326285117 complete'}, // Remove attachment using the field
        ],
    }, async ({page}) => {
        const opened = await openArticleWithAttachmentsField(page);
        const kept = {file: SECOND_IMAGE_FILE, title: 'Kept doc', description: 'stays on the item'};

        await opened.useWidget();
        await opened.widget.attach([PUBLIC_ATTACHMENT, INTERNAL_ATTACHMENT, kept]);
        await expect(opened.widget.list.getByTestId('attachment-title')).toHaveCount(3);

        await opened.widget.remove(PUBLIC_ATTACHMENT.title);
        await expect(opened.widget.title(kept.title)).toBeVisible();
        await expect(opened.widget.list.getByTestId('attachment-title')).toHaveCount(2);

        await opened.useField();
        await expect(opened.field.title(PUBLIC_ATTACHMENT.title)).toHaveCount(0);
        await opened.field.remove(INTERNAL_ATTACHMENT.title);
        await expect(opened.field.title(kept.title)).toBeVisible();
        await expect(opened.field.list.getByTestId('attachment-title')).toHaveCount(1);

        const reopened = await saveCloseAndReopen(page, opened.authoring);

        await expect(reopened.field.title(kept.title)).toBeVisible();
        await expect(reopened.field.list.getByTestId('attachment-title')).toHaveCount(1);
        await reopened.useWidget();
        await expect(reopened.widget.list.getByTestId('attachment-title')).toHaveCount(1);
    });
});

async function openSportsArticleWidget(page: Page): Promise<{authoring: AuthoringReact; widget: AttachmentsPane}> {
    const monitoring = new Monitoring(page);
    const authoring = new AuthoringReact(page);

    await monitoring.openMonitoringForDesk('Sports');
    await monitoring.editItem(monitoring.getArticleLocator('test sports story'), authoring.root);
    await authoring.waitForAuthoringReactToInitialize();

    const panel = await authoring.openWidgetByIcon('attachments');

    await expect(panel.getByTestId('attachments-pane')).toBeVisible();

    return {authoring, widget: new AttachmentsPane(panel.getByTestId('attachments-pane'))};
}

async function expectNinjsAttachments(page: Page, titles: Array<string>): Promise<void> {
    await page.goto('/#/publish_queue');

    const queueTable = page.getByTestId('publish-queue-table');
    const queuedRow = queueTable.getByTestId('publish-queue-item')
        .and(page.locator('[data-test-value="test sports story"]'))
        .filter({hasText: 'Public API'});

    // the queue list is only read when the view loads
    await expect(async () => {
        await page.getByTestId('refresh').click();
        await expect(queuedRow).toBeVisible({timeout: 2000});
    }).toPass({timeout: 60000});

    expect(await getCellValueByColumTitle(queueTable, queuedRow, 'Subscriber')).toBe('Public API');

    await queuedRow.click();

    const preview = page.getByTestId('authoring-preview');

    await preview.getByRole('tab', {name: 'Item history'}).click();
    await preview.getByTestId('toggle-transmission-details').click();
    await preview.getByTestId('queued-item').and(page.locator('[data-test-value="NINJS Email"]')).click();

    const transmitted = page.getByTestId('transmitted-item');

    await expect(transmitted).toBeVisible();

    const ninjs: {attachments?: Array<{title: string}>} = JSON.parse((await transmitted.innerText()).trim());

    expect((ninjs.attachments ?? []).map((attachment) => attachment.title)).toEqual(titles);
}

test.describe('attachments in the NINJS output (authoring-react)', () => {
    test('the NINJS sent to the subscriber carries the public attachments only', {
        annotation: [
            {type: 'confluence', description: '1326285069 complete'}, // Attachments in NINJS output
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'publishing'});

        const opened = await openArticleWithAttachmentsField(page);

        await opened.useWidget();
        await opened.widget.attach([PUBLIC_ATTACHMENT, INTERNAL_ATTACHMENT]);

        const {request} = await opened.authoring.saveAndGetRequest();

        expect(request.attachments).toHaveLength(2);

        await opened.authoring.publish({subscribers: []});
        await expectNinjsAttachments(page, [PUBLIC_ATTACHMENT.title]);
    });

    test('attachments added from the widget on a profile without the field are saved and published', {
        annotation: [
            {type: 'confluence', description: '1326285069 complete'}, // Attachments in NINJS output
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'publishing'});

        const {authoring, widget} = await openSportsArticleWidget(page);

        await widget.attach([PUBLIC_ATTACHMENT, INTERNAL_ATTACHMENT]);

        const {request} = await authoring.saveAndGetRequest();

        expect(request.attachments).toHaveLength(2);

        await authoring.publish({subscribers: []});
        await expectNinjsAttachments(page, [PUBLIC_ATTACHMENT.title]);
    });
});

test.describe('linking article body text to an attachment (authoring-react)', () => {
    test('the link dialog lists public attachments only and inserts a link that persists', {
        annotation: [
            {type: 'confluence', description: '1326285066 complete'}, // Link to attachment
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const opened = await openArticleWithAttachmentsField(page);
        const {authoring} = opened;
        const body = authoring.fieldContainer('body_html');
        const linkText = 'attachment link';

        await opened.field.attach([PUBLIC_ATTACHMENT, INTERNAL_ATTACHMENT]);

        const attachmentTab = await authoring.openAttachmentLinkDialog('body_html', linkText);
        const publicRow = attachmentTab.getByTestId('link-attachment-item')
            .and(page.locator(`[data-test-value="${PUBLIC_ATTACHMENT.title}"]`));

        await expect(publicRow).toBeVisible();
        await expect(
            attachmentTab.getByTestId('link-attachment-item')
                .and(page.locator(`[data-test-value="${INTERNAL_ATTACHMENT.title}"]`)),
        ).toHaveCount(0);

        await publicRow.click();
        await attachmentTab.getByTestId('insert').click();
        await expect(attachmentTab).toBeHidden();

        const insertedLink = body.locator('a[data-attachment]');

        await expect(insertedLink).toHaveText(linkText);
        await expect(insertedLink).toHaveAttribute('title', PUBLIC_ATTACHMENT.title);

        await authoring.saveAndGetRequest();
        await authoring.close();
        await openArticleWithAttachmentsField(page);

        await expect(body.locator('a[data-attachment]')).toHaveText(linkText);
        await expect(body.locator('a[data-attachment]')).toHaveAttribute('title', PUBLIC_ATTACHMENT.title);
    });

    test('the link dialog lists attachments added from the widget on a profile without the field', {
        annotation: [
            {type: 'confluence', description: '1326285066 complete'}, // Link to attachment
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const {authoring, widget} = await openSportsArticleWidget(page);

        await widget.attach([PUBLIC_ATTACHMENT]);
        await authoring.widgetTab('attachments').click();
        await expect(page.getByTestId('authoring-widget-panel')).toBeHidden();

        const attachmentTab = await authoring.openAttachmentLinkDialog('body_html', 'attachment link');

        await expect(
            attachmentTab.getByTestId('link-attachment-item')
                .and(page.locator(`[data-test-value="${PUBLIC_ATTACHMENT.title}"]`)),
        ).toBeVisible();
    });
});
