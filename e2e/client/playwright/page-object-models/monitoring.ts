import {Page, Locator, expect} from '@playwright/test';
import {s} from '../utils';

export class Monitoring {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async selectDeskOrWorkspace(deskName: string): Promise<void> {
        const deskSelectDropdown = this.page.locator(s('monitoring--selected-desk'));

        await expect(deskSelectDropdown).toBeVisible();

        const selectedDeskText = await deskSelectDropdown.textContent();

        if (selectedDeskText == null) {
            throw new Error();
        }

        if (selectedDeskText.toLocaleLowerCase().includes(deskName.toLocaleLowerCase()) !== true) {
            await deskSelectDropdown.click();
            await this.page.locator(`${s('monitoring--select-desk-options')} button`, {hasText: deskName}).click();
        }
    }

    /**
     * opens 3-dot menu for an article and clicks on an action(supports nested actions)
     */
    async executeActionOnMonitoringItem(item: Locator, ...actionPath: Array<string>): Promise<void> {
        await item.hover();
        await item.locator(s('context-menu-button')).click();

        const actionsWithoutLast = actionPath.slice(0, actionPath.length - 1);

        for (const action of actionsWithoutLast) {
            await this.page.locator(s('context-menu')).getByRole('button', {name: action, exact: true}).hover();
        }

        await this.page.locator(s('context-menu'))
            .getByRole('button', {name: actionPath[actionPath.length - 1], exact: true})
            .click();
    }

    /**
     * Opens the 3-dot menu for an article, hovers a submenu parent entry and clicks an inner item.
     *
     * AngularJS dropdown submenus only render after the parent receives a mouseenter event,
     * and the inner items often have an accessible name that mixes an icon glyph with the
     * visible label (e.g. `MAIN`, `Sports Desk`). `getByRole('button', {name, exact: true})`
     * is unreliable in that case, so we explicitly re-hover the parent (mouseMove out then in)
     * to force the submenu to open and locate the inner item by text or by test id.
     */
    async executeSubmenuAction(
        item: Locator,
        parentLabel: string,
        innerLabel: string,
        opts?: {innerByTestId?: string},
    ): Promise<void> {
        await item.hover();
        await item.locator(s('context-menu-button')).click();

        const contextMenu = this.page.locator(s('context-menu'));
        const parent = contextMenu.getByRole('button', {name: parentLabel, exact: true});

        await parent.hover();

        // mouse-move away then onto the parent to force the AngularJS dropdown to (re)open
        const box = await parent.boundingBox();

        if (box != null) {
            await this.page.mouse.move(box.x - 100, box.y - 100);
        }

        await parent.hover();

        if (opts?.innerByTestId != null) {
            await this.page.locator(s('context-menu', opts.innerByTestId)).click();
        } else {
            await contextMenu.getByText(innerLabel, {exact: true}).click();
        }
    }

    async executeBulkAction(action: string, articleNames: Array<string>): Promise<void> {
        for (const selectedArticle of articleNames) {
            await this.page.locator(s(`article-item=${selectedArticle}`, 'item-type-and-multi-select')).hover();
            await this.page.locator(s(`article-item=${selectedArticle}`, 'multi-select-checkbox')).check();
        }

        await this.page.locator(s('multi-action-bar', 'multi-actions-inline', action)).click();
    }

    async createArticleFromTemplate(template: string, options?: {slugline?:string, body_html?: string}): Promise<void> {
        await this.page.locator(s('content-create')).click();
        await this.page.locator(s('content-create-dropdown')).getByRole('button', {name: 'More Templates...'}).click();
        await this.page
            .locator(s('content-create-dropdown'))
            .getByRole('button', {name: template, exact: true})
            .click();

        if (options?.slugline != null) {
            await this.page.locator(s('authoring', 'field-slugline')).fill(options.slugline);
        }

        if (options?.body_html != null) {
            await this.page.locator(
                s('authoring', 'authoring-field=body_html'),
            ).getByRole('textbox').fill(options.body_html);
        }
    }

    async createArticleFromDefaultTemplate(): Promise<void> {
        await this.page.getByTestId('content-create').click();
        await this.page.getByTestId('content-create-dropdown').getByTestId('default-desk-template').click();
    }

    /**
     * Creates an article with the Ctrl+M shortcut and waits for it to open for editing.
     *
     * The binding is a window-level keydown listener registered once at startup
     * (`registerGlobalKeybindings` in core/keyboard/keyboard.ts). It builds the item
     * from the active desk's default content template and only acts while the route
     * is under `workspace` or `search`, so the caller must already be on one of them.
     */
    async createArticleWithKeyboardShortcut(): Promise<void> {
        await this.page.keyboard.press('Control+m');

        await expect(this.page.getByTestId('authoring-topbar')).toBeVisible();
    }

    async openMediaUploadView(): Promise<void> {
        await this.page.locator(s('content-create')).click();
        await this.page.locator(s('content-create-dropdown')).getByRole('button', {name: 'Upload media'}).click();
    }

    getArticleLocator(headline: string): Locator {
        return this.page.locator(s('article-item=' + headline));
    }

    getPreviewPane(): Locator {
        return this.page.getByTestId('authoring-preview');
    }

    async openPreviewTab(name: string): Promise<void> {
        await this.getPreviewPane().getByRole('tab', {name, exact: true}).click();
    }
}
