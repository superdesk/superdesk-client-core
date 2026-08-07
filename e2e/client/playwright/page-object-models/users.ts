import {expect, Locator, Page} from '@playwright/test';

export class Users {
    private readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * The same form backs the list preview pane and the full profile view, so
     * only ever use it while exactly one of the two is on screen.
     */
    get detailsForm(): Locator {
        return this.page.getByTestId('user-details-form');
    }

    getListItem(displayName: string): Locator {
        return this.page.getByTestId('users-list').getByTestId('users-list-item').filter({hasText: displayName});
    }

    async openList(): Promise<void> {
        await this.page.goto('/#/users');

        // The list opens on a filtered subset; "All" makes the lookup independent
        // of whether the user under test is active, disabled or pending.
        await this.page.getByTestId('user-filter').selectOption('All');

        // Both the route change and the filter change fetch the list, and until a
        // fetch lands the table holds no rows at all. A negative assertion made
        // against an empty table passes for the wrong reason, so hold every caller
        // here until there is something to assert on.
        await expect(this.page.getByTestId('users-list').getByTestId('users-list-item')).not.toHaveCount(0);
    }

    async openFullProfile(displayName: string): Promise<void> {
        await this.getListItem(displayName).click();
        await this.page.getByTestId('view-full-profile').click();

        // Selecting a row already renders the very same form in the list preview
        // pane, so waiting for the form alone can match the pane that the route
        // change is about to throw away, and edits typed into it are lost. The
        // page title only exists in the full profile view, so wait for that first.
        await expect(this.page.getByTestId('page-nav-title')).toContainText(displayName);
        await expect(this.detailsForm).toBeVisible();
    }

    /**
     * Username and email are checked for uniqueness by an async validator. While
     * one is in flight Angular marks the form `ng-pending`: Save stays enabled
     * (it only tracks `$invalid`) but its `userForm.$valid && save()` handler
     * silently does nothing, so clicking too early loses the edit.
     *
     * Saving then destroys and re-creates the form while it re-reads the user
     * from the server (`ng-if="!loading"`), so a persisted save is only
     * observable once the action bar is back with Save clean again.
     */
    async saveProfile(): Promise<void> {
        const save = this.detailsForm.getByTestId('action-bar').getByTestId('save');

        await expect(this.detailsForm).not.toHaveClass(/ng-pending/);
        await save.click();
        await expect(save).toBeDisabled();
    }
}
