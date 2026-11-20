import {Locator, Page, expect} from '@playwright/test';

export class EditorialActions {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async open() {
        await this.page.goto('/#/ai-studio/editorial-actions');
        await expect(this.page.getByTestId('ai-studio-editorial-actions')).toBeVisible();
    }

    get items(): Locator {
        return this.page.getByTestId('ai-action-list').getByTestId('ai-action-item');
    }

    item(name: string): Locator {
        return this.items.and(this.page.locator(`[data-test-value="${name}"]`));
    }

    get editor(): Locator {
        return this.page.getByTestId('ai-action-editor');
    }

    async startNew(actionType: 'suggestion' | 'summary') {
        await this.page.getByTestId('ai-action-create').getByRole('button').click();
        await this.page.getByTestId('ai-action-create-type')
            .and(this.page.locator(`[data-test-value="${actionType}"]`))
            .click();
        await expect(this.editor).toBeVisible();
    }

    async openTab(name: 'Configuration' | 'AI Settings') {
        await this.editor.getByTestId('ai-action-tabs').getByRole('tab', {name}).click();
    }

    async addInputField(label: string) {
        await this.editor.getByTestId('ai-action-input-fields').getByTestId('open-popover').click();
        await this.page.getByTestId('tree-select-popover')
            .getByTestId('option')
            .filter({hasText: new RegExp(`^${label}$`)})
            .click();
    }

    /** Resolves once the server has answered the save, so the list reflects it */
    async save() {
        await Promise.all([
            this.page.waitForResponse((response) => ['POST', 'PATCH'].includes(response.request().method())
                && new URL(response.url()).pathname.includes('/ai_actions')),
            this.editor.getByTestId('ai-action-save').click(),
        ]);
    }

    async filterBy(label: 'All' | 'Suggestions' | 'Summaries') {
        await this.page.getByTestId('ai-action-type-filter').getByText(label, {exact: true}).click();
    }

    async delete(name: string) {
        await this.item(name).getByTestId('ai-action-menu').getByRole('button').click();
        // The menu is rendered in a portal, outside the item
        await this.page.getByTestId('ai-action-delete').click();
        await this.page.getByTestId('confirmation-modal--confirm').click();
    }
}
