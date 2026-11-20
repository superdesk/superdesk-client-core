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

    async openArticleActionsMenu(item: Locator): Promise<Locator> {
        const contextMenu = this.page.getByTestId('context-menu');

        // The button renders only while its row is hovered, and a row that re-renders forgets the hover.
        // Only a click that never happened is retried, so an open menu is never clicked shut.
        await expect(async () => {
            await item.hover();
            await item.getByTestId('context-menu-button').click({timeout: 2000});
        }).toPass();
        await expect(contextMenu).toBeVisible();

        return contextMenu;
    }

    // MenuItems handles Escape on the menu element (focused on mount), not on the page.
    async closeActionsMenu(): Promise<void> {
        const menu = this.page.getByTestId('context-menu');

        await menu.press('Escape');
        await expect(menu).toBeHidden();
    }

    // AggregateCtrl.getDefaultGroups can run before the current desk resolves, which leaves
    // the view with no groups and no query; only a reload recovers. Keep the toPass budget well
    // under the test timeout, since toPass cannot interrupt a running attempt.
    async openMonitoringForDesk(deskName: string): Promise<void> {
        let loaded = false;

        await expect(async () => {
            if (loaded) {
                await this.page.reload();
            } else {
                await this.page.goto('/#/workspace/monitoring');
                loaded = true;
            }

            await this.selectDeskOrWorkspace(deskName);
            await expect(this.page.getByTestId('monitoring-group').first()).toBeVisible({timeout: 10000});
        }).toPass({timeout: 45000});
    }

    /**
     * opens 3-dot menu for an article and clicks on an action(supports nested actions)
     */
    async executeActionOnMonitoringItem(item: Locator, ...actionPath: Array<string>): Promise<void> {
        const contextMenu = await this.openArticleActionsMenu(item);

        const actionsWithoutLast = actionPath.slice(0, actionPath.length - 1);

        for (const action of actionsWithoutLast) {
            await contextMenu.getByRole('button', {name: action, exact: true}).hover();
        }

        await contextMenu
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
        const contextMenu = await this.openArticleActionsMenu(item);
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

    /**
     * Ticks the multi-select checkbox of an item, which only shows while its type icon is hovered.
     */
    async multiSelect(item: Locator): Promise<void> {
        await item.getByTestId('item-type-and-multi-select').hover();

        const checkbox = item.getByTestId('multi-select-checkbox');

        await checkbox.click();
        await expect(checkbox).toHaveAttribute('aria-checked', 'true');
    }

    /**
     * Runs an action of the multi-action bar, which lists actions inline when there is room for
     * them and in a dropdown otherwise.
     *
     * Monitoring re-measures the bar 300ms after the editor opens or closes and marks nothing when
     * done, so the form is read until two readings half a second apart agree.
     */
    async executeMultiAction(action: string): Promise<void> {
        const bar = this.page.getByTestId('multi-action-bar');
        const inline = bar.getByTestId('multi-actions-inline');
        const dropdown = bar.getByTestId('multi-actions-dropdown');

        await expect(inline.or(dropdown)).toBeVisible();

        let previousForm: 'inline' | 'dropdown' | null = null;

        await expect.poll(async () => {
            const form = await inline.isVisible() ? 'inline' : 'dropdown';
            const settled = form === previousForm;

            previousForm = form;

            return settled;
        }, {intervals: [500]}).toBe(true);

        if (previousForm === 'inline') {
            await inline.getByTestId(action).click();
        } else {
            await dropdown.getByTestId('dropdown-toggle').click();
            await dropdown.getByTestId(action).click();
        }
    }

    // the side menu's Highlights entry lists the highlights on hover
    async openHighlight(highlightName: string): Promise<void> {
        await this.page.getByTestId('highlights-menu').hover();
        await this.page.getByTestId('highlights-menu-item')
            .and(this.page.locator(`[data-test-value="${highlightName}"]`))
            .click();
        await expect(this.page.getByTestId('articles-list--heading')).toHaveText(highlightName);
    }

    async createHighlightsPackage(): Promise<void> {
        await this.page.getByTestId('articles-list--toolbar').getByTestId('create-highlights-package').click();
    }

    async executeBulkAction(action: string, articleNames: Array<string>): Promise<void> {
        for (const selectedArticle of articleNames) {
            await this.page.locator(s(`article-item=${selectedArticle}`, 'item-type-and-multi-select')).hover();
            await this.page.locator(s(`article-item=${selectedArticle}`, 'multi-select-checkbox')).check();
        }

        await this.page.locator(s('multi-action-bar', 'multi-actions-inline', action)).click();
    }

    async confirmExport(): Promise<void> {
        // sd-modal moves the visible dialog out of its [sd-modal] host, so the
        // host stays hidden; drive the dialog's own controls instead.
        const confirm = this.page.getByTestId('export-confirm');

        await expect(confirm).toBeVisible();
        await this.page.getByTestId('export-formatter').selectOption({index: 0});
        await confirm.click();
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
        const dropdown = await this.openContentCreateDropdown();

        await dropdown.getByTestId('default-desk-template').click();
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

    // The shortcut only acts while the route is under `workspace` or `search`.
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

    /** Every article of a monitoring group, in the order the group lists them. */
    getGroupedArticlesLocator(groupName: string): Locator {
        return this.page.getByTestId('monitoring-group')
            .and(this.page.locator(`[data-test-value="${groupName}"]`))
            .getByTestId('article-item');
    }

    getListedArticles(): Locator {
        return this.page.getByTestId('monitoring-view').getByTestId('article-item');
    }

    getListedArticle(label: string): Locator {
        return this.getListedArticles().and(this.page.locator(`[data-test-value="${label}"]`));
    }

    getFileTypeFilterButtons(): Locator {
        return this.page.getByTestId('monitoring-filter-buttons').getByTestId(/^file-type-filter--/);
    }

    getFileTypeFilterButton(fileType: string): Locator {
        return this.page.getByTestId('monitoring-filter-buttons').getByTestId(`file-type-filter--${fileType}`);
    }

    /**
     * Locates an article in a specific monitoring group by its exact label.
     * Attribute matching is used instead of `filter({hasText})` because labels
     * of distinct items may share a prefix (e.g. "Story 5" and "Story 5.1").
     */
    getGroupedArticleLocator(groupName: string, articleLabel: string): Locator {
        return this.getGroupedArticlesLocator(groupName)
            .and(this.page.locator(`[data-test-value="${articleLabel}"]`));
    }

    getGroupLocator(groupName: string): Locator {
        return this.getGroupLocators().and(this.page.locator(`[data-test-value="${groupName}"]`));
    }

    getGroupLocators(): Locator {
        return this.page.getByTestId('monitoring-view').getByTestId('monitoring-group');
    }

    /** The groups of the open view, in order, by their `data-test-value`. */
    async expectGroups(groupNames: Array<string>): Promise<void> {
        await expect
            .poll(() => this.getGroupLocators()
                .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-test-value'))))
            .toEqual(groupNames);
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

    getMarkedDesksIndicator(item: Locator): Locator {
        return item.getByTestId('mark-for-desk--bell');
    }

    /** The list is rendered outside the item. */
    async openMarkedDesks(item: Locator): Promise<Locator> {
        await this.getMarkedDesksIndicator(item).click();

        const list = this.page.getByTestId('marked-desk-list');

        await expect(list).toBeVisible();

        return list;
    }
}
