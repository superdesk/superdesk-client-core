import {Locator, Page, expect} from '@playwright/test';

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

    async openDestinationOptions(): Promise<Locator> {
        await this.root.getByTestId('destination-select').getByTestId('open-popover').click();

        // the option list is rendered in a portal outside the panel, so it is not under `root`
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
