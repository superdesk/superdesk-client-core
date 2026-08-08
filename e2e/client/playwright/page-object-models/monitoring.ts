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

    /**
     * The right-aligned button stack of the monitoring toolbar (refresh, monitoring
     * settings, monitoring filter buttons, create new item). The file type filters are
     * not in here, they live in the second subnav row.
     */
    getToolbarActions(): Locator {
        return this.page.getByTestId('monitoring-toolbar-actions');
    }

    /**
     * Only rendered while a custom workspace is the active selection; on a desk the
     * monitoring settings are reached from the desks settings page instead
     * (see `monitoring-view.html`, `aggregate.settings.type === 'workspace'`).
     */
    getMonitoringSettingsButton(): Locator {
        return this.getToolbarActions().getByTestId('monitoring-settings-button');
    }

    getCreateItemButton(): Locator {
        return this.getToolbarActions().getByTestId('content-create');
    }

    /**
     * One template backs both entry points into the monitoring settings, so the
     * dialog carries the desk-flavoured test id even in a custom workspace.
     */
    getMonitoringSettingsDialog(): Locator {
        return this.page.getByTestId('desk--monitoring-settings');
    }

    async openMonitoringSettings(): Promise<void> {
        await this.getMonitoringSettingsButton().click();
        await expect(this.getMonitoringSettingsDialog()).toBeVisible();
    }

    /**
     * Tab titles come from the wizard step titles, e.g. `Desks`, `Saved Searches`,
     * `Reorder Sections`, `Items Count`.
     */
    getMonitoringSettingsTabs(): Locator {
        return this.getMonitoringSettingsDialog().getByTestId(/^wizard--/);
    }

    async openMonitoringSettingsTab(title: string): Promise<void> {
        await this.getMonitoringSettingsDialog().getByTestId(`wizard--${title}`).click();
    }

    async closeMonitoringSettings(): Promise<void> {
        await this.getMonitoringSettingsDialog().getByRole('button', {name: 'Cancel'}).click();
        await expect(this.getMonitoringSettingsDialog()).toBeHidden();
    }
}
