import {Page, Locator, expect} from '@playwright/test';
import {dismissSessionExpiry, s} from '../utils';

export class Monitoring {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Waits for a monitoring view that accepts clicks. On the first navigation
     * after a snapshot restore, an unauthenticated first request can cover
     * monitoring with the "session has expired" overlay, and the re-login that
     * clears it can raise the first-run "Welcome to Superdesk" modal (the
     * phone_home flag is read while the backend is still settling). Both swallow
     * every click until dismissed, so retry until neither is in the way.
     */
    async waitUntilReady(): Promise<void> {
        await expect(async () => {
            await dismissSessionExpiry(this.page);

            const skipWelcome = this.page.getByRole('button', {name: 'Skip', exact: true});

            if (await skipWelcome.isVisible()) {
                await skipWelcome.click();
            }

            await expect(this.page.locator('.modal__backdrop')).toHaveCount(0);
            await expect(this.page.getByTestId('monitoring--selected-desk')).toBeVisible({timeout: 5000});
        }).toPass({timeout: 90000});
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

    async openContentCreateDropdown(): Promise<Locator> {
        const dropdown = this.page.getByTestId('content-create-dropdown');

        await this.page.getByTestId('content-create').click();
        await expect(dropdown).toBeVisible();

        return dropdown;
    }

    async createEmptyPackage(): Promise<void> {
        const dropdown = await this.openContentCreateDropdown();

        await dropdown.getByTestId('create-package').click();
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
