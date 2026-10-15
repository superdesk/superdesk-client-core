import {expect, Locator, Page} from '@playwright/test';

export type IArticleSource = 'published' | 'scheduled' | 'in_progress';
export type IWebhookFilter = 'all' | 'enabled' | 'disabled';

/**
 * Drives the content lists extension: the lists grid, the list editor
 * (items pane and article picker) and the webhooks modal.
 */
export class ContentLists {
    private readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // grid

    get grid(): Locator {
        return this.page.getByTestId('content-lists--grid');
    }

    getCard(name: string): Locator {
        return this.grid.getByTestId('content-list-card').and(this.page.locator(`[data-test-value="${name}"]`));
    }

    async openGrid(): Promise<void> {
        await this.page.goto('/#/content-lists');
        await expect(this.grid).toBeVisible();
    }

    async createList(name: string): Promise<void> {
        await this.grid.getByTestId('content-lists--create').click();
        await this.grid.getByTestId('content-lists--new-list-name').fill(name);
        await this.grid.getByTestId('content-lists--new-list-confirm').click();
    }

    async filterLists(text: string): Promise<void> {
        await this.grid.getByTestId('content-lists--search').getByRole('textbox').fill(text);
    }

    /** Opens the "Actions" menu of a card and picks one of its items. */
    private async selectCardAction(name: string, testId: string): Promise<void> {
        await this.getCard(name).getByTestId('content-list-card--actions').click();
        await this.page.getByTestId(testId).click();
    }

    async openListSettings(name: string): Promise<void> {
        await this.selectCardAction(name, 'content-list-card--settings');
        await expect(this.settingsModal).toBeVisible();
    }

    async removeList(name: string): Promise<void> {
        await this.selectCardAction(name, 'content-list-card--remove');
        await this.confirm();
    }

    get settingsModal(): Locator {
        return this.page.getByTestId('content-list-settings');
    }

    async saveListSettings(): Promise<void> {
        await this.page.getByTestId('content-list-settings--save').click();
        await expect(this.settingsModal).toHaveCount(0);
    }

    // editor

    get editor(): Locator {
        return this.page.getByTestId('content-list--editor');
    }

    get itemsPane(): Locator {
        return this.page.getByTestId('content-list--items-pane');
    }

    get items(): Locator {
        return this.page.getByTestId('content-list--items');
    }

    get pickerPane(): Locator {
        return this.page.getByTestId('content-list--picker-pane');
    }

    get pickerResults(): Locator {
        return this.page.getByTestId('content-list--picker-results');
    }

    get saveButton(): Locator {
        return this.page.getByTestId('content-list--save');
    }

    /** A row identified by its article id (`data-test-value`) inside a given pane. */
    getArticleRow(pane: Locator, contentId: string): Locator {
        return pane.getByTestId('content-list-item').and(this.page.locator(`[data-test-value="${contentId}"]`));
    }

    getListedArticle(contentId: string): Locator {
        return this.getArticleRow(this.items, contentId);
    }

    getPickerArticle(contentId: string): Locator {
        return this.getArticleRow(this.pickerResults, contentId);
    }

    /** Article ids of the listed rows, top to bottom. */
    getListedOrder(): Promise<Array<string>> {
        return this.items
            .getByTestId('content-list-item')
            .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-test-value') ?? ''));
    }

    async openList(listId: string): Promise<void> {
        await this.page.goto(`/#/content-lists?list=${listId}`);
        await expect(this.editor).toBeVisible();
    }

    async openListFromCard(name: string): Promise<void> {
        await this.getCard(name).getByTestId('content-list-card--edit').click();
        await expect(this.editor).toBeVisible();
    }

    async backToGrid(): Promise<void> {
        await this.page.getByTestId('content-list--back').click();
        await expect(this.grid).toBeVisible();
    }

    async selectPickerSource(source: IArticleSource): Promise<void> {
        await this.pickerPane.getByTestId('content-list--picker-source').click();
        await this.page
            .getByTestId('content-list--picker-source-option')
            .and(this.page.locator(`[data-test-value="${source}"]`))
            .click();
    }

    async searchArticles(text: string): Promise<void> {
        await this.pickerPane.getByTestId('content-list--picker-search').getByRole('textbox').fill(text);
    }

    async removeListedArticle(contentId: string): Promise<void> {
        await this.getListedArticle(contentId).getByTestId('content-list-item--remove').click();
    }

    async togglePin(contentId: string): Promise<void> {
        await this.getListedArticle(contentId).getByTestId('content-list-item--pin').click();
    }

    async dragPickerArticleToList(contentId: string): Promise<void> {
        await this.dragAndDrop(this.getPickerArticle(contentId), this.items);
        await expect(this.getListedArticle(contentId)).toBeVisible();
    }

    /**
     * Saves the list and waits for the save to settle.
     *
     * Saving PATCHes the items, then the editor reloads them (a GET on the
     * same path), which is what clears the unsaved-changes state. Navigating
     * away or reloading before that either aborts the in-flight request or
     * trips the "unsaved changes will be lost" confirmation, so callers only
     * get control back once the reload has landed and Save is clean again.
     */
    async save(listId: string): Promise<void> {
        const itemsReloaded = this.page.waitForResponse(
            (response) =>
                response.url().includes(`content_lists/${listId}/items`)
                && response.request().method() === 'GET'
                && response.ok(),
        );

        await expect(this.saveButton).toBeEnabled();
        await this.saveButton.click();
        await itemsReloaded;
        await expect(this.saveButton).toBeDisabled();
    }

    /**
     * Drag & drop for react-beautiful-dnd. Playwright's `dragTo` doesn't
     * work with it reliably; rbd needs a sequence of distinct mouse events
     * with multiple move steps to pick the drag up.
     */
    async dragAndDrop(source: Locator, target: Locator): Promise<void> {
        const sourceBox = await source.boundingBox();
        const targetBox = await target.boundingBox();

        if (sourceBox == null || targetBox == null) {
            throw new Error('dragAndDrop: element is not visible');
        }

        const from = {x: sourceBox.x + sourceBox.width / 2, y: sourceBox.y + sourceBox.height / 2};
        const to = {x: targetBox.x + targetBox.width / 2, y: targetBox.y + targetBox.height / 2};

        await this.page.mouse.move(from.x, from.y);
        await this.page.mouse.down();

        // small initial movement so react-beautiful-dnd starts the drag
        await this.page.mouse.move(from.x + 5, from.y + 5, {steps: 3});
        await this.page.waitForTimeout(50);

        const steps = 15;

        for (let i = 1; i <= steps; i++) {
            await this.page.mouse.move(
                from.x + ((to.x - from.x) * i) / steps,
                from.y + ((to.y - from.y) * i) / steps,
            );

            // eslint-disable-next-line no-await-in-loop
            await this.page.waitForTimeout(20);
        }

        /*
         * rbd throttles mouse moves through requestAnimationFrame, so the last
         * move of the loop may still be unprocessed when the button is released --
         * the drop then lands on the previous position, outside the target. Repeat
         * the final position and give it a frame or two to be picked up.
         */
        await this.page.mouse.move(to.x, to.y);
        await this.page.waitForTimeout(100);

        await this.page.mouse.up();
    }

    // webhooks

    get webhooksModal(): Locator {
        return this.page.getByTestId('manage-webhooks');
    }

    get webhookEditPanel(): Locator {
        return this.page.getByTestId('webhook-edit-panel');
    }

    getWebhookItem(url: string): Locator {
        return this.webhooksModal.getByTestId('webhook-item').and(this.page.locator(`[data-test-value="${url}"]`));
    }

    async openWebhooksModal(): Promise<void> {
        await this.openGrid();
        await this.grid.getByTestId('content-lists--settings-menu-button').click();
        await this.page.getByTestId('content-lists--webhooks').click();
        await expect(this.webhooksModal).toBeVisible();
    }

    async openNewWebhookPanel(): Promise<void> {
        await this.webhooksModal.getByTestId('manage-webhooks--create').click();
        await expect(this.webhookEditPanel).toBeVisible();
    }

    async fillWebhookUrl(url: string): Promise<void> {
        await this.webhookEditPanel.getByTestId('webhook-edit-panel--url').fill(url);
    }

    async saveWebhook(): Promise<void> {
        await this.webhookEditPanel.getByTestId('webhook-edit-panel--save').click();
    }

    async filterWebhooks(filter: IWebhookFilter): Promise<void> {
        await this.webhooksModal.getByTestId('manage-webhooks--filter').click();
        await this.page
            .getByTestId('manage-webhooks--filter-option')
            .and(this.page.locator(`[data-test-value="${filter}"]`))
            .click();
    }

    async removeWebhook(url: string): Promise<void> {
        // the actions slide in on hovering the row
        await this.getWebhookItem(url).hover();
        await this.webhooksModal
            .getByTestId('webhook-item--actions')
            .and(this.page.locator(`[data-test-value="${url}"]`))
            .click();
        await this.page.getByTestId('webhook-item--remove').click();
        await this.confirm();
    }

    // shared

    async confirm(): Promise<void> {
        await this.page.getByTestId('confirmation-modal').getByTestId('confirmation-modal--confirm').click();
    }
}
