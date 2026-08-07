import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot} from './utils';
import {Users} from './page-object-models/users';

/**
 * QA case "Edit user profile" (Confluence 1311834348, User management).
 *
 * An administrator edits another user's profile from the users list, and revokes
 * that user's administrator status so the application stops marking them as one.
 *
 * Documented expected results not covered here, and why:
 *
 * - Downgrading through the Role field ("Administrator" role to an "Editor"
 *   role). The `main` snapshot ships an empty `roles` collection, so the Role
 *   select renders no options and no role tag is ever shown. Blocked on a
 *   fixture with roles.
 * - Observing the downgraded user's own effective privileges (what they can
 *   still do once they are no longer an administrator). That needs a session as
 *   that user, and no non-administrator account in the snapshot has a known
 *   password; the admin UI can only trigger a reset-password email, not set one.
 *   Blocked on a fixture with a non-administrator user whose password is known.
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
});
