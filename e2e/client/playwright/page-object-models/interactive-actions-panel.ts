import {Locator, Page, expect} from '@playwright/test';

/**
 * Drives the interactive actions panel (Send to / Duplicate to / Fetch to). The markup is the same
 * from the authoring topbar, a monitoring context menu or the multi action bar.
 */
export class InteractiveActionsPanel {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    get root(): Locator {
        return this.page.getByTestId('interactive-actions-panel');
    }

    async openSendToFromAuthoring(): Promise<void> {
        await this.page.getByTestId('authoring-topbar').getByTestId('open-send-publish-pane').click();
        await this.root.getByTestId('tabs').getByRole('tab', {name: 'Send to'}).click();
    }

    /**
     * Opens the destination dropdown and returns the option list. The list is rendered in a
     * portal outside the panel, so it is located from the page, not from `root`.
     */
    async openDestinationOptions(): Promise<Locator> {
        await this.root.getByTestId('destination-select').getByTestId('open-popover').click();

        const options = this.page.getByTestId('tree-select-popover').getByTestId('options');

        await expect(options).toBeVisible();

        return options;
    }

    async selectDestination(destination: string): Promise<void> {
        const options = await this.openDestinationOptions();

        await options.getByRole('treeitem', {name: destination, exact: true}).click();
    }

    async send(): Promise<void> {
        await this.root.getByTestId('send').click();
        await expect(this.root).toBeHidden();
    }
}
