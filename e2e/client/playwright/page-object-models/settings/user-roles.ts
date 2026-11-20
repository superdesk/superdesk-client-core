import {Locator, Page, expect} from '@playwright/test';

export class UserRolesSettings {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async open(): Promise<void> {
        await this.page.goto('/#/settings/user-roles');
        await expect(this.page.getByTestId('add-role')).toBeVisible();
    }

    // page.goto() to the same hash route is a same-document no-op, so a real reload is needed.
    async reload(): Promise<void> {
        await this.page.reload();

        // A full app boot is slower than a route change.
        await expect(this.page.getByTestId('add-role')).toBeVisible({timeout: 60000});
    }

    getRole(roleName: string): Locator {
        return this.withValue(this.page.getByTestId('role-item'), roleName);
    }

    async createRole(options: {name: string; description?: string}): Promise<void> {
        await this.page.getByTestId('add-role').click();

        const modal = this.page.getByTestId('role-modal');

        await modal.getByTestId('field--name').fill(options.name);

        if (options.description != null) {
            await modal.getByTestId('field--description').fill(options.description);
        }

        await modal.getByTestId('save').click();

        // sd-modal keeps its content in the DOM and only hides it, so wait for
        // the hidden state instead of for detachment.
        await expect(modal.getByTestId('field--name')).toBeHidden();
    }

    async openPrivilegesTab(): Promise<void> {
        await this.page.getByTestId('roles-privileges-tab').click();
        await expect(this.page.getByTestId('roles-privileges-form')).toBeVisible();
    }

    /**
     * Privilege identifiers (the `data-test-value` of every table row), in table
     * order. The set is whatever the backend's /api/privileges returns, so read
     * it rather than hardcoding it when an assertion should span all privileges.
     */
    async getPrivilegeNames(): Promise<Array<string>> {
        const rows = this.page.getByTestId('privilege-row');

        // ng-repeat attaches the rows before Angular interpolates
        // data-test-value, so an unguarded read returns empty strings. Every row
        // is interpolated in the same digest, so the first one settling means
        // they all have.
        await expect(rows.first()).toHaveAttribute('data-test-value', /\S/);

        return rows.evaluateAll(
            (elements) => elements
                .map((row) => row.getAttribute('data-test-value'))
                .filter((name): name is string => name != null && name !== ''),
        );
    }

    getPrivilegeCheckbox(privilege: string, roleName: string): Locator {
        return this.withValue(
            this.withValue(this.page.getByTestId('privilege-row'), privilege).getByTestId('privilege-checkbox'),
            roleName,
        );
    }

    async grantAllPrivileges(roleName: string): Promise<void> {
        await this.withValue(this.page.getByTestId('role-column'), roleName)
            .getByTestId('toggle-all-privileges')
            .check();
    }

    async savePrivileges(): Promise<void> {
        const saveButton = this.page.getByTestId('save-privileges');

        await saveButton.click();

        // The directive marks the form pristine only once every role PATCH has
        // resolved, which re-disables the button; that is the save's completion.
        await expect(saveButton).toBeDisabled();
    }

    private withValue(locator: Locator, value: string): Locator {
        return locator.and(this.page.locator(`[data-test-value="${value}"]`));
    }
}
