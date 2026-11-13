import {Page, Locator, expect} from '@playwright/test';

export class Dashboard {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    getWidget(widgetId: string): Locator {
        return this.page
            .getByTestId('widget-grid')
            .getByTestId('widget')
            .and(this.page.locator(`[data-test-value="${widgetId}"]`));
    }

    async addWidget(widgetId: string): Promise<void> {
        const modal = this.page.getByTestId('widget-modal');

        await this.page.getByRole('button', {name: 'Add widget'}).click();
        await modal
            .getByTestId('widget-item')
            .and(this.page.locator(`[data-test-value="${widgetId}"]`))
            .click();
        await modal.getByRole('button', {name: 'Add This Widget'}).click();
        await modal.getByRole('button', {name: 'Done'}).click();

        await expect(modal).not.toBeVisible();
        await expect(this.getWidget(widgetId)).toBeVisible();
    }

    async openWidgetConfiguration(widgetId: string): Promise<void> {
        await this.getWidget(widgetId).getByRole('button', {name: 'Widget settings'}).click();
        await expect(this.page.getByTestId('widget-config-body')).toBeVisible();
    }

    async saveWidgetConfiguration(): Promise<void> {
        await this.page.getByTestId('widget-config-save').click();
        await expect(this.page.getByTestId('widget-config-body')).toBeHidden();
    }

    async closeWidgetConfiguration(): Promise<void> {
        await this.page.getByTestId('widget-config-close').click();
        await expect(this.page.getByTestId('widget-config-body')).toBeHidden();
    }
}
