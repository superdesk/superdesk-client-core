import {Locator, Page, expect} from '@playwright/test';

// The advanced search panel predates test ids: its toggle, the Marked Desks row and the Search
// button are reached by class, element id and accessible name.
export class GlobalSearch {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    get results(): Locator {
        return this.page.getByTestId('article-item');
    }

    private get panel(): Locator {
        return this.page.getByTestId('advanced-search-panel');
    }

    async open(): Promise<void> {
        await this.page.goto('/#/search');
        await expect(this.results.first()).toBeVisible();
    }

    // The panel remembers whether it was open, so the toggle is clicked only when it is closed.
    private async openParameters(): Promise<void> {
        if (await this.panel.count() === 0) {
            await this.page.locator('.filter-trigger').click();
        }

        await this.panel.getByRole('tab', {name: 'Parameters'}).click();
    }

    // Applying the filter in place sometimes leaves the unfiltered list on screen, without the filter
    // tag, although the filtered query was answered. The filter is in the URL by then, so a reload
    // renders the filtered list from scratch.
    async filterByMarkedDesk(deskName: string): Promise<void> {
        await this.openParameters();

        const markedDesks = this.panel.locator('#search-marked-desks');

        await markedDesks.getByRole('button', {name: 'Add new'}).click();
        await markedDesks.getByTestId('dropdown__item').filter({hasText: deskName}).click();
        await this.page
            .getByRole('region', {name: 'Advanced search panel'})
            .getByRole('button', {name: 'Search', exact: true})
            .click();

        await expect(this.page).toHaveURL(/[?&]marked_desks=/);
        await this.page.reload();
    }
}
