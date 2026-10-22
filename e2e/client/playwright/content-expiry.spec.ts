import {test, expect, Locator, Page} from '@playwright/test';
import {restoreDatabaseSnapshot} from './utils';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {IContentExpiry} from './page-object-models/content-expiry';
import {DeskSettings} from './page-object-models/settings/desks';
import {IngestSettings} from './page-object-models/settings/ingest';

/**
 * Content expiry at desk, stage and ingest level.
 *
 * Covered: setting an expiry at each level and it persisting, the inherited
 * ("Using <Desk|System> default" / "OFF") expiry the settings UI shows for a
 * level that has none of its own, and the expiry the backend stamps on an item
 * from the desk and stage it is created on or sent to, read from the item
 * preview's Metadata tab.
 *
 * Uncovered expected results and why:
 *
 * - "Check again after expiry date and time is reached - items are removed"
 *   (1344444534 step 3, 1344444536 CASE 1 step 4 / CASE 2 step 4) and "item is
 *   removed when expiry date and time is reached" (1344444532 step 1): removal
 *   is done by a backend background job (SDESK-5932), and the shortest expiry
 *   the form accepts is one minute. Reaching the expected result means waiting
 *   for wall-clock time to pass, which no spec here may do.
 * - "Published items have automatically set content expiry = 7 days. This is
 *   not expected to be overwritten by desk content expiry" (1344444534): the
 *   rule is driven by the backend's `publish_content_expiry_minutes`, which the
 *   e2e stack reports as 0 in `/api/client_config`. Published items get no
 *   expiry at all here, so the rule cannot be observed.
 *
 * Deliberate departures from the case steps:
 *
 * - The desk and stage cases say "create a new desk". These tests configure the
 *   snapshot's Sports desk instead: creating a desk is already covered by
 *   desks.spec.ts, and a new desk would also need members before its stages
 *   appear in monitoring, which is not what these cases are about.
 * - They also say "create a few items with different workflow states". The
 *   effective expiry is derived from the item's desk and stage, so the tests
 *   vary the desk / stage configuration instead and assert one item per
 *   configuration. The one state that does have its own rule, published, is the
 *   `publish_content_expiry_minutes` case named above.
 * - 1344444532 step 1 says the new ingest source's expiry works; only the
 *   "set it while creating the source" half is deterministic, and it is
 *   asserted on a File feed source rather than a live feed, because creating a
 *   source whose feeding service must be reachable fails without one.
 */

const MINUTE = 60 * 1000;

const DESK_EXPIRY: IContentExpiry = {days: 1, hours: 2, minutes: 0};
const DESK_EXPIRY_MINUTES = 26 * 60;

const STAGE_EXPIRY: IContentExpiry = {days: 0, hours: 3, minutes: 0};
const STAGE_EXPIRY_MINUTES = 3 * 60;

const INGEST_EXPIRY: IContentExpiry = {days: 0, hours: 5, minutes: 30};

const INGEST_PROVIDER = 'Antara news provider';
const INGESTED_ITEM = 'Indonesia opens pasteurized milk facility to back free meals program';

/**
 * Both timestamps come from the same document, so the comparison does not
 * depend on the test host's clock agreeing with the backend's. The backend
 * stamps `expiry` as "now + effective expiry" when the item is written, so the
 * gap is the configured expiry plus however long the test spent in authoring.
 */
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

/**
 * Creates an article on Sports, saves it and closes authoring.
 *
 * Autosave is debounced, so saving before the typed slugline has been autosaved
 * leaves the queued autosave to re-dirty the item and raise the "Save changes?"
 * prompt on close. Waiting for the autosave first keeps the close deterministic.
 */
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

    // A click that lands while monitoring is re-rendering its groups (as it
    // does after an item changes stage) leaves no preview open, so retry the
    // whole open until the Metadata tab is up.
    await expect(async () => {
        await item.click();
        await expect(preview).toBeVisible({timeout: 5000});
        await monitoring.openPreviewTab('Metadata');
        await expect(preview.getByTestId('metadata-created')).toBeVisible({timeout: 5000});
    }).toPass({timeout: 20000});

    return preview;
}

test.describe('content expiry', () => {
    // These tests walk the settings wizards and then authoring, which does not
    // fit the 30s default.
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

        // Sports ships with `content_expiry: 0`, which the directive reads as
        // "expiry on, nothing set", so the badge falls back to the system
        // default `content_expiry_minutes` (0 in the e2e backend, hence "OFF").
        await expect(deskExpiry.effective).toHaveText('OFF');

        await deskExpiry.set(DESK_EXPIRY);

        // A desk-level value replaces the inherited one, so the badge goes away.
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

        // Moving the item onto a stage without its own expiry re-derives it
        // from the desk.
        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await monitoring.executeActionOnMonitoringItem(monitoring.getArticleLocator(slugline), 'Edit');
        await authoring.sendTo({desk: 'Sports', stage: 'Incoming Stage'});

        // Preview only after the item is listed under the new stage: until the
        // list refreshes it still holds the pre-move document, expiry included.
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

        // With the desk expiry off the fallback is the system default, 0 in the
        // e2e backend, so the other stages show "OFF" rather than a desk value.
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

        // A File feed saves without the backend reaching the configured
        // endpoint. An RSS source is rejected with "API ingest connection
        // error" unless its URL answers, which no e2e run can guarantee.
        await ingest.modal.locator('#provider-feeding-service').selectOption({label: 'File feed'});
        await ingest.modal.locator('#file-path').fill('/tmp');

        // A source with no expiry of its own inherits the backend's
        // `ingest_expiry_minutes`, 2880 in the e2e stack.
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
        // The snapshot's only provider is closed, which the default Active
        // filter hides.
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
