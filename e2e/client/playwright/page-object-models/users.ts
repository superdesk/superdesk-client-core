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

        // The previous filter's rows stay on screen until a new query resolves, so wait for the
        // "All" response itself: it is the only one without `is_active` in its `where` clause.
        const allUsersFetched = this.page.waitForResponse(
            (response) => response.url().includes('/api/users?')
                && response.request().method() === 'GET'
                && !decodeURIComponent(response.url()).includes('is_active'),
        );

        // The list opens on a filtered subset; "All" makes the lookup independent
        // of whether the user under test is active, disabled or pending.
        await this.page.getByTestId('user-filter').selectOption('All');
        await allUsersFetched;

        // A negative assertion against an empty table passes for the wrong reason.
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

    async openProfileSection(sectionId: 'overview' | 'preferences' | 'privileges'): Promise<void> {
        await this.page.getByTestId('page-sections').getByTestId('page-section')
            .and(this.page.locator(`[data-test-value="${sectionId}"]`))
            .click();
    }

    getPrivilegeRow(privilege: string): Locator {
        return this.page.getByTestId('user-privileges-form').getByTestId('privilege-row')
            .and(this.page.locator(`[data-test-value="${privilege}"]`));
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
