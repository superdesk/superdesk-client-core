import {test, expect, Locator, Page} from '@playwright/test';
import {restoreDatabaseSnapshot} from './utils';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {IContentExpiry} from './page-object-models/content-expiry';
import {DeskSettings} from './page-object-models/settings/desks';
import {IngestSettings} from './page-object-models/settings/ingest';

/**
 * Content expiry at desk, stage and ingest level, and the expiry the backend stamps on items (read from the
 * preview Metadata tab).
 *
 * Not covered: item removal at expiry (backend job SDESK-5932, would need wall-clock waiting) and the 7-day
 * published-item rule (the e2e backend reports `publish_content_expiry_minutes` as 0).
 * Departures from the cases: Sports is configured instead of creating a desk (desks.spec.ts covers that); desk and
 * stage config is varied instead of workflow states; the ingest source is a File feed, as a live feed needs a
 * reachable service to save.
 */

const MINUTE = 60 * 1000;

const DESK_EXPIRY: IContentExpiry = {days: 1, hours: 2, minutes: 0};
const DESK_EXPIRY_MINUTES = 26 * 60;

const STAGE_EXPIRY: IContentExpiry = {days: 0, hours: 3, minutes: 0};
const STAGE_EXPIRY_MINUTES = 3 * 60;

const INGEST_EXPIRY: IContentExpiry = {days: 0, hours: 5, minutes: 30};

const INGEST_PROVIDER = 'Antara news provider';
const INGESTED_ITEM = 'Indonesia opens pasteurized milk facility to back free meals program';

// Both timestamps come from the same document, so the test host's clock does not matter. The gap is the
// configured expiry plus the time the test spent in authoring, hence the slack in expectExpiryOffset.
async function getExpiryOffsetMinutes(preview: Locator): Promise<number> {
    const created = preview.getByTestId('metadata-created').locator('time');
    const expiry = preview.getByTestId('metadata-expiry').locator('time');

    await expect(created).toHaveAttribute('datetime', /\d/);
    await expect(expiry).toHaveAttribute('datetime', /\d/);

    const [createdAt, expiresAt] = await Promise.all([
        created.getAttribute('datetime'),
        expiry.getAttribute('datetime'),
    ]);

    return (Date.parse(expiresAt as string) - Date.parse(createdAt as string)) / MINUTE;
}

async function expectExpiryOffset(preview: Locator, expectedMinutes: number): Promise<void> {
    const offset = await getExpiryOffsetMinutes(preview);

    expect(offset).toBeGreaterThanOrEqual(expectedMinutes);
    expect(offset).toBeLessThan(expectedMinutes + 5);
}

// Wait for the debounced autosave before saving, or it re-dirties the item and closing raises "Save changes?".
async function createArticle(page: Page, slugline: string): Promise<void> {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    const [autosave] = await Promise.all([
        page.waitForResponse(
            (r) => /\/archive_autosave$/.test(new URL(r.url()).pathname) && r.request().method() === 'POST',
        ),
        monitoring.createArticleFromTemplate('story', {slugline}),
    ]);

    expect(autosave.status()).toBe(201);

    await page.getByTestId('authoring-topbar').getByTestId('save').click();
    await expect(monitoring.getArticleLocator(slugline)).toBeVisible();

    await page.getByTestId('authoring-topbar').getByTestId('close').click();
    await expect(page.getByTestId('authoring-topbar')).toBeHidden();
}

async function openMetadataPreview(page: Page, articleLabel: string): Promise<Locator> {
    const monitoring = new Monitoring(page);
    const item = monitoring.getArticleLocator(articleLabel);
    const preview = monitoring.getPreviewPane();

    await expect(item).toBeVisible();

    // A click during a monitoring re-render (e.g. after a stage change) opens no preview, so retry the whole open.
    await expect(async () => {
        await item.click();
        await expect(preview).toBeVisible({timeout: 5000});
        await monitoring.openPreviewTab('Metadata');
        await expect(preview.getByTestId('metadata-created')).toBeVisible({timeout: 5000});
    }).toPass({timeout: 20000});

    return preview;
}

test.describe('content expiry', () => {
    test.describe.configure({timeout: 90000});

    test('a desk content expiry is stored and applied to items created on the desk', {
        annotation: [
            {type: 'confluence', description: '1344444534 partial'}, // Content expiry on desk level
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const desks = new DeskSettings(page);

        await desks.open();
        await desks.openEdit('Sports');

        const deskExpiry = desks.deskContentExpiry;

        // Sports ships with `content_expiry: 0`, read as "nothing set", so the badge shows the system default ("OFF").
        await expect(deskExpiry.effective).toHaveText('OFF');

        await deskExpiry.set(DESK_EXPIRY);

        await deskExpiry.expectValue(DESK_EXPIRY);
        await expect(deskExpiry.effective).toHaveCount(0);

        await desks.saveAndClose();

        await desks.openEdit('Sports');
        await desks.deskContentExpiry.expectValue(DESK_EXPIRY);
        await desks.closeModal();

        const slugline = 'desk expiry story';

        await createArticle(page, slugline);
        await expectExpiryOffset(await openMetadataPreview(page, slugline), DESK_EXPIRY_MINUTES);
    });

    test('a stage content expiry overrides the desk one, other stages keep the desk one', {
        annotation: [
            {type: 'confluence', description: '1344444536 partial'}, // Content expiry on stage level
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const desks = new DeskSettings(page);

        await desks.open();
        await desks.openEdit('Sports');
        await desks.deskContentExpiry.set(DESK_EXPIRY);
        await desks.saveAndContinueToStages();

        await desks.openStageEdit('Working Stage');
        await desks.stageContentExpiry.set(STAGE_EXPIRY);
        await desks.saveStage();

        await desks.selectStage('Working Stage');
        await expect(desks.stageExpirySummary).toHaveText('0 day 3 hr 0 min');

        await desks.selectStage('Incoming Stage');
        await expect(desks.stageExpirySummary).toHaveText('Using Desk default (days:1 hr:2 min:0)');

        await desks.closeModal();

        const slugline = 'stage expiry story';

        await createArticle(page, slugline);
        await expectExpiryOffset(await openMetadataPreview(page, slugline), STAGE_EXPIRY_MINUTES);

        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await monitoring.executeActionOnMonitoringItem(monitoring.getArticleLocator(slugline), 'Edit');
        await authoring.sendTo({desk: 'Sports', stage: 'Incoming Stage'});

        // Until the list refreshes it still holds the pre-move document, expiry included.
        const incomingStage = page.getByTestId('monitoring-group')
            .and(page.locator('[data-test-value="Sports / Incoming Stage"]'));

        await expect(incomingStage.getByTestId('article-item')
            .and(page.locator(`[data-test-value="${slugline}"]`))).toBeVisible();

        await expectExpiryOffset(await openMetadataPreview(page, slugline), DESK_EXPIRY_MINUTES);
    });

    test('a stage content expiry applies while the desk has none', {
        annotation: [
            {type: 'confluence', description: '1344444536 partial'}, // Content expiry on stage level
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const desks = new DeskSettings(page);

        await desks.open();
        await desks.openEdit('Sports');
        await desks.deskContentExpiry.turnOff();
        await desks.saveAndContinueToStages();

        await desks.openStageEdit('Working Stage');
        await desks.stageContentExpiry.set(STAGE_EXPIRY);
        await desks.saveStage();

        await desks.selectStage('Working Stage');
        await expect(desks.stageExpirySummary).toHaveText('0 day 3 hr 0 min');

        // With the desk expiry off the fallback is the system default (0), so other stages show "OFF".
        await desks.selectStage('Incoming Stage');
        await expect(desks.stageExpirySummary).toHaveText('OFF');

        await desks.closeModal();

        const slugline = 'stage only expiry story';

        await createArticle(page, slugline);
        await expectExpiryOffset(await openMetadataPreview(page, slugline), STAGE_EXPIRY_MINUTES);
    });

    test('a content expiry set while creating an ingest source is stored on it', {
        annotation: [
            {type: 'confluence', description: '1344444532 partial'}, // Content expiry on Ingest
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const ingest = new IngestSettings(page);
        const sourceName = 'Expiry source';

        await ingest.open();
        await ingest.addNewSource();

        await ingest.modal.getByTestId('ingest-source-modal--field--name').fill(sourceName);
        await ingest.modal.getByTestId('ingest-source-modal--field--source').fill('expiry-src');

        // An RSS source is rejected ("API ingest connection error") unless its URL answers; a File feed is not.
        await ingest.modal.locator('#provider-feeding-service').selectOption({label: 'File feed'});
        await ingest.modal.locator('#file-path').fill('/tmp');

        // No own expiry: inherits `ingest_expiry_minutes` (2880 in the e2e stack).
        await expect(ingest.contentExpiry.effective).toHaveText('Using System default');
        await expect(ingest.contentExpiry.effective).toHaveAttribute('title', 'days:2 hr:0 min:0');

        await ingest.contentExpiry.set(INGEST_EXPIRY);
        await expect(ingest.contentExpiry.effective).toHaveCount(0);

        await ingest.save();

        await ingest.openEdit(sourceName);
        await ingest.contentExpiry.expectValue(INGEST_EXPIRY);
    });

    test('changing an ingest source content expiry leaves already ingested items untouched', {
        annotation: [
            {type: 'confluence', description: '1344444532 partial'}, // Content expiry on Ingest
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        await page.goto('/#/workspace/ingest');

        const expiryBefore = await (await openMetadataPreview(page, INGESTED_ITEM))
            .getByTestId('metadata-expiry').locator('time').getAttribute('datetime');

        expect(expiryBefore).not.toBeNull();

        const ingest = new IngestSettings(page);

        await ingest.open();
        // The snapshot's only provider is closed, so the default Active filter hides it.
        await ingest.filterByStatus('Closed');
        await ingest.openEdit(INGEST_PROVIDER);
        await ingest.contentExpiry.set(INGEST_EXPIRY);
        await ingest.save();

        await ingest.openEdit(INGEST_PROVIDER);
        await ingest.contentExpiry.expectValue(INGEST_EXPIRY);
        await ingest.modal.getByRole('button', {name: 'Cancel'}).click();
        await expect(ingest.modal).toBeHidden();

        await page.goto('/#/workspace/ingest');

        const expiryAfter = await (await openMetadataPreview(page, INGESTED_ITEM))
            .getByTestId('metadata-expiry').locator('time').getAttribute('datetime');

        expect(expiryAfter).toBe(expiryBefore);
    });
});
