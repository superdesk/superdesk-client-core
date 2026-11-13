import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot} from './utils';
import {UserRolesSettings} from './page-object-models/settings/user-roles';

// QA case "User roles" (Confluence 1311834342). Partial, deviations:
// - 4 of the 11 restricted privileges (featured stories, global filters, planning item
//   management, manage locations) come from superdesk-planning, which is not in this stack.
// - Not checked that the restrictions block actions: a UI-created user has no password and
//   the snapshot has no non-admin user with known credentials, so we cannot log in as one.

const ROLE_NAME = 'Editor';

// Restricted privileges that exist in this backend, by `/api/privileges` name.
const RESTRICTED_PRIVILEGES = [
    'unlock',
    'spike',
    'publish',
    'unpublish',
    'roles',
    'mark_for_user',
    'masterdesk',
];

test('a role granted every privilege but the restricted ones, applied to a user', {
    annotation: [
        {type: 'confluence', description: '1311834342 partial'}, // User roles
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();

    const userRoles = new UserRolesSettings(page);

    await userRoles.open();
    await expect(userRoles.getRole(ROLE_NAME)).toHaveCount(0);

    await userRoles.createRole({name: ROLE_NAME, description: 'Editor without publishing rights'});
    await expect(userRoles.getRole(ROLE_NAME)).toBeVisible();

    await userRoles.openPrivilegesTab();

    const privilegeNames = await userRoles.getPrivilegeNames();

    for (const privilege of RESTRICTED_PRIVILEGES) {
        expect(privilegeNames).toContain(privilege);
    }

    await userRoles.grantAllPrivileges(ROLE_NAME);

    for (const privilege of RESTRICTED_PRIVILEGES) {
        await userRoles.getPrivilegeCheckbox(privilege, ROLE_NAME).uncheck();
    }

    await userRoles.savePrivileges();

    // Reload to prove the split was persisted server-side, not just held in the
    // directive's scope.
    await userRoles.reload();
    await userRoles.openPrivilegesTab();

    for (const privilege of privilegeNames) {
        const checkbox = userRoles.getPrivilegeCheckbox(privilege, ROLE_NAME);

        if (RESTRICTED_PRIVILEGES.includes(privilege)) {
            await expect(checkbox).not.toBeChecked();
        } else {
            await expect(checkbox).toBeChecked();
        }
    }

    await page.goto('/#/users');
    await page.getByTestId('user-filter').selectOption('All');
    await page.getByTestId('create-user-button').click();

    const userForm = page.getByTestId('user-details-form');

    await userForm.getByTestId('field--first_name').fill('Jane');
    await userForm.getByTestId('field--last_name').fill('Editor');
    await userForm.getByTestId('field--username').fill('janeeditor');
    await userForm.getByTestId('field--email').fill('janeeditor@example.com');
    await userForm.getByTestId('field--role').selectOption({label: ROLE_NAME});
    await userForm.getByTestId('save').click();

    const newUser = page.getByTestId('users-list').getByTestId('users-list-item').filter({hasText: 'janeeditor'});

    await expect(newUser).toBeVisible();

    await newUser.click();
    await page.getByTestId('view-full-profile').click();

    await page.getByTestId('page-sections')
        .getByTestId('page-section')
        .and(page.locator('[data-test-value="privileges"]'))
        .click();

    const userPrivileges = page.getByTestId('user-privileges-form');

    await expect(userPrivileges).toBeVisible();

    for (const privilege of privilegeNames) {
        const row = userPrivileges.getByTestId('privilege-row')
            .and(page.locator(`[data-test-value="${privilege}"]`));
        const checkbox = row.getByTestId('privilege-checkbox');

        if (RESTRICTED_PRIVILEGES.includes(privilege)) {
            await expect(checkbox).not.toBeChecked();
            await expect(checkbox).toBeEnabled();
            await expect(row.getByTestId('privilege-granted-by-role')).toHaveCount(0);
        } else {
            await expect(checkbox).toBeChecked();
            await expect(checkbox).toBeDisabled();
            await expect(row.getByTestId('privilege-granted-by-role')).toHaveText(ROLE_NAME);
        }
    }
});
