import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {MediaUpload} from './page-object-models/upload';
import {MediaEditor} from './page-object-models/media-editor';
import {restoreDatabaseSnapshot} from './utils';
import {setEditor3FieldValue} from './utils/editor3';
import {
    AUDIO_FILE,
    AUDIO_FILES,
    IMAGE_FILES,
    MIXED_FILES,
    NOT_MEDIA_FILE,
    VIDEO_FILE,
    VIDEO_FILES,
    expectEmptyUploadScreen,
    expectErrorNotification,
    expectFilesReadyToUpload,
    expectPendingItemTypes,
    expectUploadToTargetDesk,
    itemsOfType,
    movePointerOffTheList,
    openUploadScreen,
} from './utils/media-upload';

/**
 * The QA cases for uploading media picked through the "Select them from folder"
 * file dialog:
 *
 * - 1315931213 Upload multiple images by selecting from folder
 * - 1315931239 Upload a single audio file by selecting from folder
 * - 1315931241 Upload multiple audio files by selecting from folder
 * - 1315931249 Upload a single video file by selecting from folder
 * - 1315931251 Upload multiple video files by selecting from folder
 * - 1315931276 Upload different media types by selecting from folder
 *
 * The six document one and the same set of expected results, differing only in
 * which files are picked, so the screen's own behaviour (its layout, the refusal of
 * files that are not media, the required metadata fields, Cancel) is covered once
 * by the first three tests, which every case is annotated on, and each case then
 * has one test walking its own selection from the dialog to the uploaded items. The
 * per-file progress circle is covered in the mixed-media test, which is why the
 * other five cases are annotated on it too.
 *
 * A case id therefore appears on several tests at two levels, and the level is a
 * statement about the case across all of them rather than about the test it is
 * written on: `complete` marks the one test that adds what the case still needed,
 * `partial` every other test that contributes to it. No single test here covers all
 * of a case's expected results on its own.
 *
 * The same set of expected results dropped onto the drop area instead is covered by
 * upload-media-dropped-files.spec.ts.
 *
 * Two expected results are asserted against the wording the product renders rather
 * than the wording the cases quote:
 * - the cases quote "Only the following files are allowed: image, audio, video";
 *   `UploadController` builds the list in image, video, audio order.
 * - the cases quote "Required filed(s) missing"; `validateMediaFieldsThrows` in
 *   ChangeImageController.ts raises "Required field {{key}} is missing. ..." and
 *   names the field.
 */

test.setTimeout(120000);

const SELECT_FROM_FOLDER_CASES = [
    {type: 'confluence', description: '1315931213 partial'}, // Upload multiple images by selecting from folder
    {type: 'confluence', description: '1315931239 partial'}, // Upload a single audio file by selecting from folder
    {type: 'confluence', description: '1315931241 partial'}, // Upload multiple audio files by selecting
    {type: 'confluence', description: '1315931249 partial'}, // Upload a single video file by selecting
    {type: 'confluence', description: '1315931251 partial'}, // Upload multiple video files by selecting
    {type: 'confluence', description: '1315931276 partial'}, // Upload different media types by selecting
];

test.beforeEach(async () => {
    await restoreDatabaseSnapshot();
});

test('the file dialog opens on "Select them from folder" and refuses a file that is not media', {
    annotation: SELECT_FROM_FOLDER_CASES,
}, async ({page}) => {
    const upload = new MediaUpload(page);

    await openUploadScreen(page);
    await expectEmptyUploadScreen(page);

    const filePicker = await upload.openFilePicker();

    // asserted before the files are handed over, because `setFiles` with several
    // payloads throws inside Playwright when the input is not `multiple`, which
    // would turn a product regression into an API error raised from the page object
    expect(filePicker.isMultiple()).toBe(true);

    await filePicker.setFiles([NOT_MEDIA_FILE]);

    await expectErrorNotification(page, 'Only the following files are allowed: image, video, audio');

    await expect(upload.getItems()).toHaveCount(0);
    await expect(upload.getModal().getByTestId('drag-files-here')).toBeVisible();
    await expect(upload.getUploadButton()).toBeDisabled();

    // the media of a mixed selection is still taken, only the rest of it is refused
    await upload.selectFiles([...MIXED_FILES, NOT_MEDIA_FILE]);

    await expectErrorNotification(page, 'Only the following files are allowed: image, video, audio');
    await expectFilesReadyToUpload(page, MIXED_FILES.length);
});

test('the upload is refused while a required metadata field is empty', {
    annotation: SELECT_FROM_FOLDER_CASES,
}, async ({page}) => {
    const upload = new MediaUpload(page);
    const mediaEditor = new MediaEditor(page);

    await openUploadScreen(page);

    await upload.selectFiles([MIXED_FILES[0]]);

    await expectFilesReadyToUpload(page, 1);

    /*
     * The red star is the `sd-line-input--required` class, put on a field's wrapper
     * from `field.required` in media-metadata-editor-directive.html.
     * `MediaFieldsController` builds those fields by merging the picture content
     * profile's schema over its editor, and adds an entry from
     * `appConfig.validator_media_metadata` only for fields the profile's editor does
     * not already carry. `description_text` is one of those, and the validator
     * (VALIDATOR_MEDIA_METADATA in e2e/server/settings.py, published to the client
     * through /api/client_config) marks it required. `slugline` comes from the
     * profile, whose schema does not require it.
     */
    await expect(mediaEditor.fieldContainer('field--description_text'))
        .toHaveClass(/sd-line-input--required/);

    // asserted visible first, or the negative below would also pass on a locator
    // that resolves to nothing
    await expect(mediaEditor.fieldContainer('field--slugline')).toBeVisible();
    await expect(mediaEditor.fieldContainer('field--slugline'))
        .not.toHaveClass(/sd-line-input--required/);

    /*
     * `headline` is starred too, from the picture profile's own schema, but the
     * refusal below consults only the validator, where headline is not required.
     * Filling nothing but the headline therefore still leaves the upload blocked,
     * which is what separates the starred set from the enforced one.
     */
    await expect(mediaEditor.fieldContainer('field--headline'))
        .toHaveClass(/sd-line-input--required/);

    await setEditor3FieldValue(mediaEditor.field('field--headline'), 'headline without a description');

    await upload.startUpload();

    await expectErrorNotification(page, /Required field .* is missing/);

    await expect(upload.getModal()).toBeVisible();
    await expect(upload.getItems()).toHaveCount(1);
});

test('cancel closes the upload media screen without uploading anything', {
    annotation: SELECT_FROM_FOLDER_CASES,
}, async ({page}) => {
    const monitoring = new Monitoring(page);
    const upload = new MediaUpload(page);
    const metadata = {
        headline: 'selected after cancelling',
        description: 'uploaded on purpose once the cancelled selection was thrown away',
    };

    /*
     * Uploading a file POSTs it to the archive endpoint. Collecting those requests
     * for the whole run is what lets the cancelled selection be judged once the run
     * is demonstrably past any upload it could have started, instead of right after
     * the click, when a wrongly uploading Cancel would not have reached the server
     * yet.
     */
    const archiveUploads: Array<string> = [];

    page.on('request', (request) => {
        if (request.method() === 'POST' && new URL(request.url()).pathname.endsWith('/archive')) {
            archiveUploads.push(request.url());
        }
    });

    await openUploadScreen(page);

    await upload.selectFiles(MIXED_FILES);

    await expectFilesReadyToUpload(page, MIXED_FILES.length);

    await upload.getCancelButton().click();

    await expect(upload.getModal()).toBeHidden();

    await monitoring.openMediaUploadView();

    // the cancelled selection was thrown away, the screen comes back empty
    await expectEmptyUploadScreen(page);

    // one file uploaded on purpose is the barrier the assertions below are made
    // behind: it is posted after anything the cancelled screen could have posted, so
    // by the time it has landed, files from a wrongly started upload would have too
    await upload.selectFiles([IMAGE_FILES[0]]);

    await expectFilesReadyToUpload(page, 1);
    await expectUploadToTargetDesk(page, {
        fileCount: 1,
        itemTypes: ['picture'],
        metadata,
    });

    expect(archiveUploads).toHaveLength(1);

    // the snapshot carries no audio and no video item at all, so the cancelled
    // selection's audio and video files would be the only ones global search could show
    await movePointerOffTheList(page);
    await expect(itemsOfType(page, 'audio')).toHaveCount(0);
    await expect(itemsOfType(page, 'video')).toHaveCount(0);
});

test('uploads a single selected audio file to the selected desk', {
    annotation: [
        {type: 'confluence', description: '1315931239 complete'}, // Upload a single audio file by selecting
    ],
}, async ({page}) => {
    const metadata = {headline: 'selected audio', description: 'selected audio description'};

    await openUploadScreen(page);
    await expectEmptyUploadScreen(page);

    await new MediaUpload(page).selectFiles([AUDIO_FILE]);

    await expectFilesReadyToUpload(page, 1);
    await expectPendingItemTypes(page, {'icon-audio': 1});
    await expectUploadToTargetDesk(page, {
        fileCount: 1,
        itemTypes: ['audio'],
        metadata,
    });
});

test('uploads a single selected video file to the selected desk', {
    annotation: [
        {type: 'confluence', description: '1315931249 complete'}, // Upload a single video file by selecting
    ],
}, async ({page}) => {
    const metadata = {headline: 'selected video', description: 'selected video description'};

    await openUploadScreen(page);
    await expectEmptyUploadScreen(page);

    await new MediaUpload(page).selectFiles([VIDEO_FILE]);

    await expectFilesReadyToUpload(page, 1);
    await expectPendingItemTypes(page, {'icon-video': 1});
    await expectUploadToTargetDesk(page, {
        fileCount: 1,
        itemTypes: ['video'],
        metadata,
    });
});

test('uploads several selected images to the selected desk', {
    annotation: [
        {type: 'confluence', description: '1315931213 complete'}, // Upload multiple images by selecting from folder
    ],
}, async ({page}) => {
    const upload = new MediaUpload(page);
    const metadata = {headline: 'selected images', description: 'selected images description'};

    await openUploadScreen(page);
    await expectEmptyUploadScreen(page);

    await upload.selectFiles(IMAGE_FILES);

    await expectFilesReadyToUpload(page, IMAGE_FILES.length);
    await expectPendingItemTypes(page, {'icon-photo': IMAGE_FILES.length});

    // a thumbnail is rendered from the picked file's own bytes, so it only shows
    // once the file was read, not merely once an item was added
    await expect(upload.getItems().locator('img')).toHaveCount(IMAGE_FILES.length);

    await expectUploadToTargetDesk(page, {
        fileCount: IMAGE_FILES.length,
        itemTypes: IMAGE_FILES.map(() => 'picture'),
        metadata,
    });
});

test('uploads several selected audio files to the selected desk', {
    annotation: [
        {type: 'confluence', description: '1315931241 complete'}, // Upload multiple audio files by selecting
    ],
}, async ({page}) => {
    const metadata = {headline: 'selected audio files', description: 'selected audio files description'};

    await openUploadScreen(page);
    await expectEmptyUploadScreen(page);

    await new MediaUpload(page).selectFiles(AUDIO_FILES);

    await expectFilesReadyToUpload(page, AUDIO_FILES.length);
    await expectPendingItemTypes(page, {'icon-audio': AUDIO_FILES.length});
    await expectUploadToTargetDesk(page, {
        fileCount: AUDIO_FILES.length,
        itemTypes: AUDIO_FILES.map(() => 'audio'),
        metadata,
    });
});

test('uploads several selected video files to the selected desk', {
    annotation: [
        {type: 'confluence', description: '1315931251 complete'}, // Upload multiple video files by selecting
    ],
}, async ({page}) => {
    const metadata = {headline: 'selected video files', description: 'selected video files description'};

    await openUploadScreen(page);
    await expectEmptyUploadScreen(page);

    await new MediaUpload(page).selectFiles(VIDEO_FILES);

    await expectFilesReadyToUpload(page, VIDEO_FILES.length);
    await expectPendingItemTypes(page, {'icon-video': VIDEO_FILES.length});
    await expectUploadToTargetDesk(page, {
        fileCount: VIDEO_FILES.length,
        itemTypes: VIDEO_FILES.map(() => 'video'),
        metadata,
    });
});

/**
 * The mixed selection is also where the per-file progress circle is covered, for
 * every select-from-folder case rather than once per media type: the circles are
 * what a three-file upload shows one by one, and holding the archive responses back
 * to observe them is the same mechanism whatever the files are.
 */
test('uploads a selected image, audio file and video file in one go', {
    annotation: [
        {type: 'confluence', description: '1315931276 complete'}, // Upload different media types by selecting
        {type: 'confluence', description: '1315931213 partial'}, // Upload multiple images by selecting from folder
        {type: 'confluence', description: '1315931239 partial'}, // Upload a single audio file by selecting
        {type: 'confluence', description: '1315931241 partial'}, // Upload multiple audio files by selecting
        {type: 'confluence', description: '1315931249 partial'}, // Upload a single video file by selecting
        {type: 'confluence', description: '1315931251 partial'}, // Upload multiple video files by selecting
    ],
}, async ({page}) => {
    const upload = new MediaUpload(page);
    const metadata = {headline: 'selected mixed media', description: 'selected mixed media description'};

    await openUploadScreen(page);
    await expectEmptyUploadScreen(page);

    await upload.selectFiles(MIXED_FILES);

    await expectFilesReadyToUpload(page, MIXED_FILES.length);
    await expectPendingItemTypes(page, {'icon-photo': 1, 'icon-audio': 1, 'icon-video': 1});

    // only the image has bytes the screen can preview
    await expect(upload.getItems().locator('img')).toHaveCount(1);

    await expectUploadToTargetDesk(page, {
        fileCount: MIXED_FILES.length,
        itemTypes: ['picture', 'audio', 'video'],
        metadata,
        withProgressCircles: true,
    });
});
