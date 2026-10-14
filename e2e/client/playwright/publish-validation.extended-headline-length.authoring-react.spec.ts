import {test, expect, type Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {MetadataSettings} from './page-object-models/settings/metadata';
import {ContentProfileSettings} from './page-object-models/settings/content-profile';
import {restoreDatabaseSnapshot} from './utils';
import {setEditor3FieldValue} from './utils/editor3';
import {getStorageState} from './utils/storage-state';

/**
 * QA case: a custom text field ("extended headline") configured with min/max
 * character limits in the content profile of a desk has those limits enforced at
 * publish time. When the saved value is shorter than the minimum or longer than
 * the maximum, publishing is blocked (the item stays in Draft) and a red error
 * toast names the offending limit.
 *
 * The message text comes from the backend content-profile validator
 * (apps/validate/validate.py): custom fields report "<display name> <cerberus
 * message>", e.g. "extended headline max length is 20" / "... min length is 10".
 */
test.use({storageState: getStorageState({}, {authoringReact: true})});

const FIELD = {id: 'extended-headline', name: 'extended headline'};
const MIN_LENGTH = 10;
const MAX_LENGTH = 20;
const BELOW_MIN = 'abc'; // 3 chars < MIN_LENGTH
const ABOVE_MAX = 'x'.repeat(MAX_LENGTH + 5); // 25 chars > MAX_LENGTH

// Adds the "extended headline" custom text field to the Story profile with limits.
async function configureExtendedHeadlineLimits(page: Page): Promise<void> {
    await new MetadataSettings(page).createCustomTextField(FIELD);
    await new ContentProfileSettings(page).addTextFieldWithLengthLimits({
        profileName: 'Story',
        tabName: 'Content',
        fieldName: FIELD.name,
        minLength: MIN_LENGTH,
        maxLength: MAX_LENGTH,
    });
}

// Opens "test sports story" (Sports desk, Story profile) in authoring-react.
async function openTestSportsStory(page: Page): Promise<void> {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.getArticleLocator('test sports story').dblclick();
    await new Authoring(page).waitForAuthoringReactToInitialize();
}

test.describe('extended headline length limits are enforced on publish (authoring-react)', () => {
    test('below the minimum blocks publishing and shows a red message', async ({page}) => {
        await restoreDatabaseSnapshot();
        await configureExtendedHeadlineLimits(page);
        await openTestSportsStory(page);

        const authoring = new Authoring(page);

        await setEditor3FieldValue(authoring.field(`authoring-field=${FIELD.id}`), BELOW_MIN);
        await authoring.saveInAuthoringReact();
        await authoring.publishInAuthoringReact();

        // A red error toast names the required minimum length.
        await expect(
            page.getByTestId('notification--error')
                .filter({hasText: `${FIELD.name} min length is ${MIN_LENGTH}`}),
        ).toBeVisible();

        // Publishing was prevented: the article is still open as a draft (the
        // publish panel stays open instead of the article closing on success).
        await expect(page.getByTestId('publish')).toBeVisible();
    });

    test('above the maximum blocks publishing and shows a red message', async ({page}) => {
        await restoreDatabaseSnapshot();
        await configureExtendedHeadlineLimits(page);
        await openTestSportsStory(page);

        const authoring = new Authoring(page);

        await setEditor3FieldValue(authoring.field(`authoring-field=${FIELD.id}`), ABOVE_MAX);
        await authoring.saveInAuthoringReact();
        await authoring.publishInAuthoringReact();

        // A red error toast names the allowed maximum length.
        await expect(
            page.getByTestId('notification--error')
                .filter({hasText: `${FIELD.name} max length is ${MAX_LENGTH}`}),
        ).toBeVisible();

        await expect(page.getByTestId('publish')).toBeVisible();
    });
});
