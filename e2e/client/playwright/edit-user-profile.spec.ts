import {test, expect, Page} from '@playwright/test';
import {restoreDatabaseSnapshot, setPasswordThroughResetEmail} from './utils';
import {Users} from './page-object-models/users';

/**
 * QA case "Edit user profile" (Confluence 1311834348, User management).
 *
 * An administrator edits another user's profile from the users list, and revokes
 * that user's administrator status so both the application and the user
 * themselves stop treating them as one.
 *
 * Documented expected results not covered here, and why:
 *
 * - Downgrading through the Role field ("Administrator" role to an "Editor"
 *   role). The `main` snapshot ships an empty `roles` collection, so the Role
 *   select renders no options and no role tag is ever shown. Blocked on a
 *   fixture with roles.
 */
test.describe('editing another user profile', {
    annotation: [
        // Edit user profile (pass 02.11)
        {type: 'confluence', description: '1311834348 partial'},
    ],
}, () => {
    test('profile edits are saved and shown across the profile and the users list', async ({page}) => {
        await restoreDatabaseSnapshot();

        const users = new Users(page);

        await users.openList();
        await users.openFullProfile('Jane Doe');

        const form = users.detailsForm;

        await form.getByTestId('field--first_name').fill('Janet');
        await form.getByTestId('field--last_name').fill('Roe');
        await form.getByTestId('field--email').fill('janet.roe@example.com');
        await form.getByLabel('phone number').fill('123456789');
        await form.getByTestId('field--sign_off').fill('JR');
        await form.getByLabel('Byline').fill('Janet Roe');

        await users.saveProfile();

        await page.reload();

        await expect(form.getByTestId('field--first_name')).toHaveValue('Janet');
        await expect(form.getByTestId('field--last_name')).toHaveValue('Roe');
        await expect(form.getByTestId('field--email')).toHaveValue('janet.roe@example.com');
        await expect(form.getByLabel('phone number')).toHaveValue('123456789');
        await expect(form.getByTestId('field--sign_off')).toHaveValue('JR');
        await expect(form.getByLabel('Byline')).toHaveValue('Janet Roe');

        // The username is not editable here, so it stays the handle the row is
        // still identified by after the rename.
        await expect(form.getByTestId('field--username')).toHaveValue('janedoe');
        await expect(page.getByTestId('page-nav-title')).toContainText('Janet Roe');

        await users.openList();

        const renamedRow = users.getListItem('Janet Roe');

        await expect(renamedRow).toBeVisible();
        await expect(renamedRow.getByTestId('username')).toHaveText('janedoe');
        await expect(renamedRow).toContainText('janet.roe@example.com');
    });

    test('revoking administrator status clears the administrator markers', async ({page}) => {
        await restoreDatabaseSnapshot();

        const users = new Users(page);
        const administratorTag = users.detailsForm.getByTestId('administrator-label');
        const administratorCheckbox = users.detailsForm.getByTestId('field--user_type');
        // The indicator superdesk-ui-framework's AvatarWrapper overlays on the
        // avatar of an administrator: a cog glyph with no test id of its own,
        // only title="Administrator".
        const administratorIndicator = () => users.getListItem('Jane Doe').getByTitle('Administrator');

        await users.openList();
        await users.openFullProfile('Jane Doe');

        await expect(administratorTag).toBeHidden();

        // The logged-in admin is the only administrator in the snapshot and
        // cannot demote itself, so the user under test is promoted first. The
        // downgrade below is the behaviour under test.
        await administratorCheckbox.click();
        await users.saveProfile();
        await expect(administratorTag).toBeVisible();

        await users.openList();
        await expect(administratorIndicator()).toBeVisible();

        await users.openFullProfile('Jane Doe');
        await administratorCheckbox.click();
        await users.saveProfile();
        await expect(administratorTag).toBeHidden();

        await page.reload();

        // `page.reload()` resolves on the load event, well before Angular has
        // rendered the form. `toBeHidden` passes on a locator that resolves to no
        // nodes, so without waiting for the form the assertion below would pass
        // against a blank page whatever the server stored.
        await expect(users.detailsForm).toBeVisible();
        await expect(administratorTag).toBeHidden();

        await users.openList();
        await expect(users.getListItem('Jane Doe')).toBeVisible();
        await expect(administratorIndicator()).toBeHidden();
    });

    test('the user loses the administrator privileges once the status is revoked', async ({page}) => {
        await restoreDatabaseSnapshot();

        const users = new Users(page);
        const profileSections = page.getByTestId('page-sections');

        // Jane has no password anyone knows, so the test gives her one. It lives
        // only until the next snapshot restore.
        const janePassword = 'janedoe123.';

        await toggleAdministrator(users);

        await signOut(page);
        await setPasswordThroughResetEmail(page, {email: 'janedoe@example.com', password: janePassword});
        await signIn(page, {username: 'janedoe', password: janePassword});

        // The Privileges tab of a profile is only offered to someone holding the
        // `users` privilege, which nothing but the administrator flag grants in
        // this snapshot (no roles, no per-user privileges), so it stands for
        // "what this user may do" as the user themselves sees it.
        await openOwnProfile(page, 'Jane Doe');
        await expect(profileSections).toContainText('Privileges');

        await signOut(page);
        await signIn(page, {username: 'admin', password: 'admin'});

        await toggleAdministrator(users);

        await signOut(page);
        await signIn(page, {username: 'janedoe', password: janePassword});

        await openOwnProfile(page, 'Jane Doe');
        await expect(profileSections).not.toContainText('Privileges');
    });
});

async function toggleAdministrator(users: Users): Promise<void> {
    await users.openList();
    await users.openFullProfile('Jane Doe');
    await users.detailsForm.getByTestId('field--user_type').click();
    await users.saveProfile();
}

async function signOut(page: Page): Promise<void> {
    await page.getByTestId('my-profile').click();
    await page.getByTestId('my-profile-dropdown').getByRole('button', {name: 'Sign out'}).click();

    await expect(page.getByTestId('login-page')).toBeVisible();
}

async function signIn(page: Page, {username, password}: {username: string; password: string}): Promise<void> {
    const loginPage = page.getByTestId('login-page');

    await loginPage.getByTestId('username').fill(username);
    await loginPage.getByTestId('password').fill(password);
    await loginPage.getByTestId('submit').click();

    await expect(page.getByTestId('top-menu')).toBeVisible();
}

/**
 * Opens the profile of whoever is signed in, checking on the way that it belongs
 * to `displayName` and that its section tabs have rendered. Asserting a tab is
 * absent before they render would pass for the wrong reason.
 */
async function openOwnProfile(page: Page, displayName: string): Promise<void> {
    await page.goto('/#/profile');

    await expect(page.getByTestId('page-nav-title')).toContainText(displayName);
    await expect(page.getByTestId('page-sections')).toBeVisible();
}
