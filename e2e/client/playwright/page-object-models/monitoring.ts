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
     * Opens the monitoring view on a desk and waits for its groups to render.
     *
     * `AggregateCtrl.getDefaultGroups` reads `desks.getCurrentDesk()._id`, and the
     * workspace watcher that calls it sometimes fires before the current desk is
     * resolved. The resulting TypeError aborts the digest, leaving the view with a
     * working subnav but no groups and no item query, and nothing re-runs that
     * query later, so reloading is the only recovery.
     *
     * The retry budget has to stay well under the caller's test timeout: `toPass` cannot
     * interrupt an attempt that is already running, so a budget equal to the test timeout would
     * be spent inside the last attempt and surface as a bare test timeout instead of this
     * assertion, with no time left for the test body.
     */
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

    /**
     * All article items currently listed in the monitoring groups.
     */
    getListedArticles(): Locator {
        return this.page.getByTestId('monitoring-view').getByTestId('article-item');
    }

    getListedArticle(label: string): Locator {
        return this.getListedArticles().and(this.page.locator(`[data-test-value="${label}"]`));
    }

    /**
     * All item type toggles in the monitoring subnav, in render order.
     */
    getFileTypeFilterButtons(): Locator {
        return this.page.getByTestId('monitoring-filter-buttons').getByTestId(/^file-type-filter--/);
    }

    /**
     * One of the item type toggles in the monitoring subnav.
     * `fileType` is the internal type, not the label: all, text, picture,
     * graphic, composite (package), highlight-pack, video, audio.
     */
    getFileTypeFilterButton(fileType: string): Locator {
        return this.page.getByTestId('monitoring-filter-buttons').getByTestId(`file-type-filter--${fileType}`);
    }

    getPreviewPane(): Locator {
        return this.page.getByTestId('authoring-preview');
    }

    async openPreviewTab(name: string): Promise<void> {
        await this.getPreviewPane().getByRole('tab', {name, exact: true}).click();
    }
}
