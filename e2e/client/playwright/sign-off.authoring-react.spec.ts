import {test, expect, Page, Response} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {loginAs, restoreDatabaseSnapshot} from './utils';
import {getLoggedOutStorageState, getStorageState} from './utils/storage-state';

const ITEM_HEADLINE = 'test sports story';

async function openItem(page: Page): Promise<Authoring> {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.getGroupedArticleLocator('Sports / Working Stage', ITEM_HEADLINE).dblclick();
    await authoring.waitForAuthoringReactToInitialize();

    return authoring;
}

async function editBody(page: Page, authoring: Authoring, text: string): Promise<void> {
    await authoring.replaceEditor3FieldText(authoring.fieldContainer('body_html').getByRole('textbox'), text);
    await expect(page.getByRole('button', {name: 'Save', exact: true})).toBeEnabled();
}

async function saveAndCapture(page: Page): Promise<{request: any; response: any}> {
    const responsePromise = page.waitForResponse(
        (r: Response) => r.request().method() === 'PATCH' && r.url().includes('/api/archive/'),
    );

    await page.getByRole('button', {name: 'Save', exact: true}).click();

    const response = await responsePromise;

    return {request: response.request().postDataJSON(), response: await response.json()};
}

test.describe('sign off (authoring-react)', () => {
    test('drops a stale draft copy on save, so the server appends the saving user\'s sign off', async ({browser}) => {
        await restoreDatabaseSnapshot({snapshotName: 'sign-off-stale'});

        const context = await browser.newContext({storageState: getLoggedOutStorageState({authoringReact: true})});

        // a context made from `browser` outlives a failed test, leaving a logged-in session that can autosave
        try {
            const page = await context.newPage();

            await loginAs(page, 'samgamgee', 'samgamgee');

            const authoring = await openItem(page);
            const saveButton = page.getByRole('button', {name: 'Save', exact: true});
            const signOffValue = authoring.fieldContainer('sign_off').getByTestId('plain-text-value');

            await expect(signOffValue).toHaveText('ADM');
            await expect(saveButton).toBeDisabled();

            await editBody(page, authoring, 'First edit');

            const first = await saveAndCapture(page);

            expect(first.request).not.toHaveProperty('sign_off');
            expect(first.request.fields_meta ?? {}).not.toHaveProperty('sign_off');
            expect(first.response.sign_off).toBe('ADM/SG');
            await expect(signOffValue).toHaveText('ADM/SG');
            await expect(saveButton).toBeDisabled();

            // Reopened rather than edited in place: an edit typed within about a second of a save is not
            // tracked (a separate bug). Reopening also shows the server's value is what loads.
            await openItem(page);
            await expect(signOffValue).toHaveText('ADM/SG');

            await editBody(page, authoring, 'Second edit');

            const second = await saveAndCapture(page);

            expect(second.request).not.toHaveProperty('sign_off');
            expect(second.response.sign_off).toBe('ADM/SG');
        } finally {
            await context.close();
        }
    });

    test.describe('as admin', () => {
        test.use({storageState: getStorageState({}, {authoringReact: true})});

        test('shows sign off locked and saves the value typed after unlocking', async ({page}) => {
            await restoreDatabaseSnapshot();

            const authoring = await openItem(page);
            const field = authoring.fieldContainer('sign_off');

            await expect(field.getByTestId('plain-text-value')).toHaveText('ADM');
            await expect(field.getByTestId('plain-text-input')).toHaveCount(0);

            await field.getByTestId('plain-text-lock').click();
            await field.getByTestId('plain-text-input').fill('ADM/XYZ');

            const saved = await saveAndCapture(page);

            expect(saved.request.sign_off).toBe('ADM/XYZ');
            expect(saved.response.sign_off).toBe('ADM/XYZ');
        });
    });
});
