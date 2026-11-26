import {test, expect, type Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {MediaEditor} from './page-object-models/media-editor';
import {PictureAuthoringReact} from './page-object-models/authoring-react';
import {MediaUpload} from './page-object-models/upload';
import {restoreDatabaseSnapshot} from './utils';
import {setEditor3FieldValue} from './utils/editor3';
import {getStorageState} from './utils/storage-state';

/**
 * QA cases for the metadata of a picture item edited in authoring-react. The metadata dialog is
 * the angular media editor; authoring-react opens it from the `_media_self` field and takes its
 * result into the open item, which is only stored by an explicit save (angular saves on Done).
 */
test.use({storageState: getStorageState({}, {authoringReact: true})});

test.setTimeout(90000);

async function openItem(page: Page, headline: string): Promise<void> {
    const monitoring = new Monitoring(page);

    await monitoring.editItem(monitoring.getArticleLocator(headline), new PictureAuthoringReact(page).mediaField);
}

// A bare `clear()` on these editor3 plain-text fields sometimes leaves characters behind.
async function clearMetadataField(page: Page, field: string): Promise<void> {
    const input = new MediaEditor(page).field(field);

    await expect(async () => {
        await input.click();
        await page.keyboard.press('ControlOrMeta+a');
        await page.keyboard.press('Backspace');
        await expect(input).toHaveText('', {timeout: 1000});
    }).toPass();
}

test('metadata edited in the media editor reaches the item, is saved, and edits in the item reach the editor', {
    annotation: [
        {type: 'confluence', description: '1311834322 partial'}, // Edit image metadata
        {type: 'confluence', description: '1315931673 partial'}, // Edit values in metadata fields
        {type: 'confluence', description: '1315931211 partial'}, // Upload a single image by selecting from folder
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();

    const upload = new MediaUpload(page);
    const monitoring = new Monitoring(page);
    const mediaEditor = new MediaEditor(page);
    const authoring = new PictureAuthoringReact(page);
    const description = authoring.fieldContainer('description_text');

    await monitoring.openMonitoringForDesk('Sports');
    await monitoring.openMediaUploadView();

    await upload.selectFile('iptc-photo.jpg');
    await setEditor3FieldValue(mediaEditor.field('field--headline'), 'picture');
    await expect(mediaEditor.field('field--headline')).toHaveText('picture');
    await upload.startUpload();

    await openItem(page, 'picture');
    await authoring.waitForAuthoringReactToInitialize();

    await authoring.openMediaEditor('Edit metadata');
    await setEditor3FieldValue(mediaEditor.field('field--description_text'), 'test description');
    await mediaEditor.saveMetadata();
    await expect(mediaEditor.header).toBeHidden();

    await expect(description).toContainText('test description');

    await authoring.saveAndClose();
    await openItem(page, 'picture');

    await expect(description).toContainText('test description');

    await authoring.waitForAuthoringReactToInitialize();
    await authoring.replaceEditor3FieldText(authoring.input('description_text'), 'new description');

    await authoring.openMediaEditor('Edit metadata');

    await expect(mediaEditor.field('field--description_text')).toHaveText('new description');
});

// `association-fields` is the only snapshot with two real pictures.
test('metadata copied from one picture is pasted onto another and saved', {
    annotation: [
        {type: 'confluence', description: '1315931669 complete'}, // Copy and paste metadata
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: 'association-fields'});

    const monitoring = new Monitoring(page);
    const mediaEditor = new MediaEditor(page);
    const authoring = new PictureAuthoringReact(page);

    const HEADLINE = 'Shared headline';
    const DESCRIPTION = 'Shared description';

    await monitoring.openMonitoringForDesk('Sports');
    await openItem(page, 'Gondor picture');
    await authoring.waitForAuthoringReactToInitialize();

    await authoring.openMediaEditor('Edit metadata');

    await expect(mediaEditor.copyMetadataButton).toBeEnabled();
    await expect(mediaEditor.pasteMetadataButton).toBeDisabled();

    await setEditor3FieldValue(mediaEditor.field('field--description_text'), DESCRIPTION);
    await setEditor3FieldValue(mediaEditor.field('field--headline'), HEADLINE);
    await clearMetadataField(page, 'field--byline');
    await mediaEditor.applyMetadataButton.click();
    await expect(mediaEditor.applyMetadataButton).toBeHidden();

    await mediaEditor.copyMetadataButton.click();
    await expect(mediaEditor.pasteMetadataButton).toBeEnabled();

    await authoring.closeMediaEditor();
    await authoring.saveAndClose();

    await openItem(page, 'Mirkwood picture');
    await authoring.waitForAuthoringReactToInitialize();
    await authoring.openMediaEditor('Edit metadata');

    await expect(mediaEditor.field('field--headline')).toHaveText('Mirkwood picture');
    await expect(mediaEditor.field('field--byline')).toHaveText('Bilbo Baggins');

    await mediaEditor.pasteMetadataButton.click();

    await expect(mediaEditor.field('field--headline')).toHaveText(HEADLINE);
    await expect(mediaEditor.field('field--slugline')).toHaveText('Gondor');
    await expect(mediaEditor.field('field--description_text')).toHaveText(DESCRIPTION);
    await expect(mediaEditor.field('field--byline')).toHaveText('');

    await mediaEditor.applyMetadataButton.click();
    await expect(mediaEditor.applyMetadataButton).toBeHidden();
    await authoring.closeMediaEditor();

    await expect(authoring.fieldContainer('description_text')).toContainText(DESCRIPTION);

    await authoring.saveAndClose();

    await expect(monitoring.getArticleLocator('Mirkwood picture')).toHaveCount(0);

    const pasted = monitoring.getArticleLocator(HEADLINE);

    await expect(pasted).toHaveCount(2);

    // Paste copies the headline too, so source and target cannot be told apart: both are checked.
    for (const index of [0, 1]) {
        await monitoring.editItem(pasted.nth(index), authoring.mediaField);
        await expect(authoring.fieldContainer('description_text')).toContainText(DESCRIPTION);
        await expect(authoring.input('byline')).toHaveText('');
        await authoring.close();
    }
});
