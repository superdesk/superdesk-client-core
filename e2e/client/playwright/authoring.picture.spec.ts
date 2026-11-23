import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {MediaEditor} from './page-object-models/media-editor';
import {PictureAuthoring} from './page-object-models/authoring';
import {MediaUpload} from './page-object-models/upload';
import {setEditor3FieldValue} from './utils/editor3';

/**
 * upload a picture
 * edit metadata
 * test metadata changes from modal are visible in the editor
 */
test('media metadata editor', {
    annotation: [
        {type: 'confluence', description: '1311834322 partial'}, // Edit image metadata
        {type: 'confluence', description: '1315931673 partial'}, // Edit values in metadata fields
        {type: 'confluence', description: '1315931211 partial'}, // Upload a single image by selecting from folder
        {type: 'confluence', description: '1311835200 partial'}, // Upload image to Personal space
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();

    const upload = new MediaUpload(page);
    const monitoring = new Monitoring(page);
    const mediaEditor = new MediaEditor(page);
    const pictureAuthoring = new PictureAuthoring(page);

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.openMediaUploadView();

    await upload.selectFile('iptc-photo.jpg');

    await setEditor3FieldValue(mediaEditor.field('field--headline'), 'picture');

    await expect(mediaEditor.field('field--headline')).toHaveText('picture');

    await upload.startUpload();

    await monitoring.executeActionOnMonitoringItem(monitoring.getArticleLocator('picture'), 'Edit');

    await pictureAuthoring.openMetadataEditor();

    await setEditor3FieldValue(mediaEditor.field('field--description_text'), 'test description');

    await mediaEditor.saveMetadata();

    await expect(pictureAuthoring.field('field--description_text')).toContainText('test description');

    await setEditor3FieldValue(pictureAuthoring.field('field--description_text'), 'new description');

    await pictureAuthoring.openMetadataEditor();

    await expect(mediaEditor.field('field--description_text')).toContainText('new description');
});

// `association-fields` is the only snapshot with two real pictures. The product does not paste a
// source field that was never set; only a field cleared on the source is pasted as empty.
test('metadata copied from one picture is pasted onto another', {
    annotation: [
        {type: 'confluence', description: '1315931669 complete'}, // Copy and paste metadata
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: 'association-fields'});

    const monitoring = new Monitoring(page);
    const mediaEditor = new MediaEditor(page);
    const pictureAuthoring = new PictureAuthoring(page);

    const HEADLINE = 'Shared headline';
    const DESCRIPTION = 'Shared description';

    // Done saves through an unawaited PATCH, which a Close issued meanwhile would make fail.
    async function done(): Promise<void> {
        const saved = page.waitForResponse(
            (response) => response.request().method() === 'PATCH' && response.url().includes('/archive/'),
        );

        await mediaEditor.doneButton.click();
        await expect(mediaEditor.header).toBeHidden();
        expect((await saved).ok()).toBe(true);
        await expect(pictureAuthoring.mediaField).toBeVisible();
    }

    // A bare `clear()` on these editor3 plain-text fields sometimes leaves characters behind.
    async function clearField(field: string): Promise<void> {
        const input = mediaEditor.field(field);

        await expect(async () => {
            await input.click();
            await page.keyboard.press('ControlOrMeta+a');
            await page.keyboard.press('Backspace');
            await expect(input).toHaveText('', {timeout: 1000});
        }).toPass();
    }

    async function closeAuthoring(): Promise<void> {
        await page.getByTestId('authoring-topbar').getByTestId('close').click();
        await expect(page.getByTestId('authoring-topbar')).toBeHidden();
    }

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.getArticleLocator('Gondor picture').dblclick();

    await pictureAuthoring.hoverMedia();
    for (const action of ['edit-metadata', 'edit-image', 'crop']) {
        await expect(pictureAuthoring.mediaField.getByTestId(action)).toBeVisible();
    }
    await pictureAuthoring.openMetadataEditor();

    await expect(mediaEditor.copyMetadataButton).toBeEnabled();
    await expect(mediaEditor.pasteMetadataButton).toBeDisabled();
    await expect(mediaEditor.clearSavedMetadataLink).toBeHidden();

    await clearField('field--description_text');
    await mediaEditor.applyMetadataButton.click();
    await expect(
        page.getByTestId('notifications').getByTestId('notification--error')
            .filter({hasText: /Required field .* is missing/}),
    ).toBeVisible();
    await expect(mediaEditor.applyMetadataButton).toBeVisible();

    await setEditor3FieldValue(mediaEditor.field('field--description_text'), DESCRIPTION);
    await setEditor3FieldValue(mediaEditor.field('field--headline'), HEADLINE);
    await clearField('field--byline');
    await mediaEditor.applyMetadataButton.click();
    await expect(mediaEditor.applyMetadataButton).toBeHidden();

    await mediaEditor.copyMetadataButton.click();
    await expect(mediaEditor.pasteMetadataButton).toBeEnabled();
    await expect(mediaEditor.clearSavedMetadataLink).toBeVisible();

    await done();
    await closeAuthoring();

    await monitoring.getArticleLocator('Mirkwood picture').dblclick();
    await pictureAuthoring.openMetadataEditor();

    await expect(mediaEditor.field('field--headline')).toHaveText('Mirkwood picture');
    await expect(mediaEditor.field('field--slugline')).toHaveText('Mirkwood');
    await expect(mediaEditor.field('field--byline')).toHaveText('Bilbo Baggins');
    await expect(mediaEditor.copyMetadataButton).toBeEnabled();
    await expect(mediaEditor.pasteMetadataButton).toBeEnabled();
    await expect(mediaEditor.clearSavedMetadataLink).toBeVisible();

    await mediaEditor.pasteMetadataButton.click();

    await expect(mediaEditor.field('field--headline')).toHaveText(HEADLINE);
    await expect(mediaEditor.field('field--slugline')).toHaveText('Gondor');
    await expect(mediaEditor.field('field--description_text')).toHaveText(DESCRIPTION);
    await expect(mediaEditor.field('field--byline')).toHaveText('');

    await mediaEditor.clearSavedMetadataLink.click();
    await expect(mediaEditor.clearSavedMetadataLink).toBeHidden();
    await expect(mediaEditor.pasteMetadataButton).toBeDisabled();

    await mediaEditor.applyMetadataButton.click();
    await expect(mediaEditor.applyMetadataButton).toBeHidden();
    await done();
    await closeAuthoring();

    await expect(monitoring.getArticleLocator('Mirkwood picture')).toHaveCount(0);

    const pasted = monitoring.getArticleLocator(HEADLINE);

    await expect(pasted).toHaveCount(2);

    // Paste copies the headline too, so source and target cannot be told apart: both are checked.
    for (const index of [0, 1]) {
        await pasted.nth(index).dblclick();
        await expect(pictureAuthoring.field('field--description_text')).toHaveText(DESCRIPTION);
        await expect(page.getByTestId('authoring').getByLabel('Byline', {exact: true})).toHaveValue('');
        await closeAuthoring();
    }
});
