import {test, expect, Page} from '@playwright/test';
import {restoreDatabaseSnapshot, setPasswordThroughResetEmail} from './utils';
import {Users} from './page-object-models/users';

/**
 * QA case "Edit user profile" (Confluence 1311834348).
 *
 * Not covered: downgrading through the Role field. The `main` snapshot has an
 * empty `roles` collection, so the Role select has no options.
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
        await form.getByTestId('field--phone').fill('123456789');
        await form.getByTestId('field--sign_off').fill('JR');
        await form.getByTestId('field--byline').fill('Janet Roe');

        await users.saveProfile();

        await page.reload();

        await expect(form.getByTestId('field--first_name')).toHaveValue('Janet');
        await expect(form.getByTestId('field--last_name')).toHaveValue('Roe');
        await expect(form.getByTestId('field--email')).toHaveValue('janet.roe@example.com');
        await expect(form.getByTestId('field--phone')).toHaveValue('123456789');
        await expect(form.getByTestId('field--sign_off')).toHaveValue('JR');
        await expect(form.getByTestId('field--byline')).toHaveValue('Janet Roe');

        // The username is not editable, so it stays the row's handle after the rename.
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
        // superdesk-ui-framework's AvatarWrapper cog overlay has no test id, only a title.
        const administratorIndicator = () => users.getListItem('Jane Doe').getByTitle('Administrator');

        await users.openList();
        await users.openFullProfile('Jane Doe');

        await expect(administratorTag).toBeHidden();

        // The snapshot's only administrator is the logged-in admin, so Jane is promoted first.
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

        // `toBeHidden` passes on no nodes, and reload() resolves before Angular renders the form.
        await expect(users.detailsForm).toBeVisible();
        await expect(administratorTag).toBeHidden();

        await users.openList();

        // UserAvatar.tsx lazy-loads the avatar, so wait for it or `toBeHidden` passes on nothing.
        await expect(users.getListItem('Jane Doe').getByTestId('user-avatar')).toBeVisible();
        await expect(administratorIndicator()).toBeHidden();
    });

    test('the user loses the administrator privileges once the status is revoked', async ({page}) => {
        await restoreDatabaseSnapshot();

        const users = new Users(page);
        const profileSections = page.getByTestId('page-sections');

        // Jane's snapshot password is unknown, so the test sets one.
        const janePassword = 'janedoe123.';

        await toggleAdministrator(users);

        await signOut(page);
        await setPasswordThroughResetEmail(page, {email: 'janedoe@example.com', password: janePassword});
        await signIn(page, {username: 'janedoe', password: janePassword});

        // The Privileges tab needs the `users` privilege, which only the administrator
        // flag grants in this snapshot.
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

// Waits for the tabs, otherwise asserting a tab is absent passes vacuously.
async function openOwnProfile(page: Page, displayName: string): Promise<void> {
    await page.goto('/#/profile');

    await expect(page.getByTestId('page-nav-title')).toContainText(displayName);
    await expect(page.getByTestId('page-sections')).toBeVisible();
}
