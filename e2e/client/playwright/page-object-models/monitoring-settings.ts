import {Locator, Page, expect} from '@playwright/test';

export type IMonitoringSettingsTab = 'Desks' | 'Saved Searches' | 'Reorder Sections' | 'Items Count';

/** `PREFERENCES_KEY` in `scripts/apps/monitoring/directives/AggregateSettings.ts`. */
const MONITORING_PREFERENCE_KEY = 'agg:view';

/**
 * Drives the "Monitoring settings" wizard modal
 * (`scripts/apps/monitoring/views/aggregate-settings.html`).
 *
 * The same template backs the desk variant reached from `/#/settings/desks` and the
 * workspace variant reached from the monitoring toolbar, so the modal's test id reads
 * `desk--monitoring-settings` in both cases.
 */
export class MonitoringSettings {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    get modal(): Locator {
        return this.page.getByTestId('desk--monitoring-settings');
    }

    /**
     * Opens the wizard from the monitoring toolbar. The toolbar button only renders while a
     * custom workspace is selected; desks configure monitoring from the desk settings page.
     */
    async open(): Promise<void> {
        await this.page.getByTestId('monitoring-settings-button').click();
        await expect(this.modal).toBeVisible();
    }

    deskCard(deskName: string): Locator {
        return this.page.getByTestId(`desk--${deskName}`);
    }

    /** Opens a desk card's 3-dot menu on `/#/settings/desks` and returns the menu itself. */
    async openDeskActions(deskName: string): Promise<Locator> {
        const card = this.deskCard(deskName);

        await card.getByTestId('desk-actions').click();

        const actions = card.getByTestId('desk-actions--options');

        await expect(actions).toBeVisible();

        return actions;
    }

    /**
     * Opens the wizard for a desk from `/#/settings/desks`, the only entry point a desk has:
     * `openMonitoringSettings` in `DeskConfigController.ts` is what sets `settings.desk`, which
     * is what makes `save()` write the desk's `monitoring_settings` instead of a user preference.
     *
     * That handler assigns into `agg.settings`, which `AggregateCtrl` only creates once its own
     * init chain (desks, saved searches, settings) has resolved. A click landing before that
     * throws a TypeError inside Angular and no modal opens, and nothing in the DOM marks the
     * controller as ready, so the open is retried until it takes.
     */
    async openForDesk(deskName: string): Promise<void> {
        await this.page.goto('/#/settings/desks');

        const actions = this.deskCard(deskName).getByTestId('desk-actions--options');

        await expect(async () => {
            if (!await actions.isVisible()) {
                await this.deskCard(deskName).getByTestId('desk-actions').click();
            }

            await actions.getByTestId('desk-actions--monitoring-settings').click();
            await expect(this.modal).toBeVisible({timeout: 3000});
        }).toPass({timeout: 20000, intervals: [500]});
    }

    tab(title: IMonitoringSettingsTab): Locator {
        return this.modal.getByTestId(`wizard--${title}`);
    }

    /**
     * The wizard marks the selected step on the `<li>` wrapping the tab button
     * (`template/wizard.html` in superdesk-ui-framework); the button itself carries no state,
     * and the template lives in a dependency so it cannot get a test id of its own.
     *
     * The `has` locator is resolved inside each `<li>`, so it must start at the page root
     * rather than reuse `tab()`, which is already scoped to the modal.
     */
    tabWrapper(title: IMonitoringSettingsTab): Locator {
        return this.modal
            .locator('li.nav-tabs__tab')
            .filter({has: this.page.getByTestId(`wizard--${title}`)});
    }

    /** Every tab in the order the wizard renders them, for asserting the set and its order. */
    get tabs(): Locator {
        return this.modal.locator('li.nav-tabs__tab');
    }

    async expectActiveTab(title: IMonitoringSettingsTab): Promise<void> {
        await expect(this.tabWrapper(title)).toHaveClass(/nav-tabs__tab--active/);
    }

    async goToTab(title: IMonitoringSettingsTab): Promise<void> {
        await this.tab(title).click();
        await this.expectActiveTab(title);
    }

    get previousButton(): Locator {
        return this.modal.getByTestId('footer').getByTestId('previous');
    }

    get nextButton(): Locator {
        return this.modal.getByTestId('footer').getByTestId('next');
    }

    get cancelButton(): Locator {
        return this.modal.getByTestId('footer').getByTestId('cancel');
    }

    get doneButton(): Locator {
        return this.modal.getByTestId('footer').getByTestId('done');
    }

    get globalSavedSearches(): Locator {
        return this.modal.getByTestId('global-saved-searches');
    }

    get privateSavedSearches(): Locator {
        return this.modal.getByTestId('private-saved-searches');
    }

    /**
     * `sd-toggle-box` renders a React box whose header is the only element that toggles it;
     * it comes from superdesk-ui-framework, so it is reachable by class only.
     */
    toggleBoxHeader(toggleBox: Locator): Locator {
        return toggleBox.locator('.toggle-box__header');
    }

    savedSearch(toggleBox: Locator, name: string): Locator {
        return toggleBox.getByTestId('saved-search').filter({hasText: name});
    }

    /**
     * `sd-switch` replaces its element with `<span class="sd-toggle">` and reflects the ON
     * state as a `checked` class on that span (`app/scripts/switch.js` in
     * superdesk-ui-framework).
     */
    savedSearchToggle(toggleBox: Locator, name: string): Locator {
        return this.savedSearch(toggleBox, name).getByTestId('toggle');
    }

    /**
     * On a workspace the wizard closes the modal without waiting for the write it started:
     * `AggregateSettings.save()` calls `onclose()` synchronously while `preferencesService.update()`
     * is still only scheduled on `$applyAsync`. Anything that leaves the page right after the modal
     * disappears can therefore cancel the PATCH and drop the configuration, so wait for the write.
     */
    async closeWithDone(): Promise<void> {
        await Promise.all([
            this.page.waitForResponse((response) => response.url().includes('/preferences/')
                && response.request().method() === 'PATCH'
                && (response.request().postData() ?? '').includes(MONITORING_PREFERENCE_KEY)),
            this.doneButton.click(),
        ]);

        await expect(this.modal).not.toBeVisible();
    }

    async closeWithCancel(): Promise<void> {
        await this.cancelButton.click();
        await expect(this.modal).not.toBeVisible();
    }

    /**
     * Done on a desk's monitoring settings PATCHes the desk
     * (`AggregateSettings.save()` -> `desks.save(desk, {monitoring_settings})`) and only finishes
     * the wizard once that write resolves, so a failed save leaves the modal open with nothing
     * naming the cause. Waiting for the response reports the status instead.
     *
     * The predicate matches URL and method only; adding `response.ok()` to it would leave a
     * failed save unmatched and turn the failure into an opaque `waitForResponse` timeout.
     */
    async closeWithDoneOnDesk(): Promise<void> {
        const [response] = await Promise.all([
            this.page.waitForResponse((res) => /\/desks\/[^/]+$/.test(res.url())
                && res.request().method() === 'PATCH'),
            this.doneButton.click(),
        ]);

        expect(response.ok(), `saving the desk monitoring settings failed with ${response.status()}`).toBe(true);
        await expect(this.modal).not.toBeVisible();
    }

    get reorderSections(): Locator {
        return this.modal.getByTestId('reorder-sections').getByTestId('reorder-section');
    }

    reorderSection(label: string): Locator {
        return this.reorderSections.filter({hasText: label});
    }

    /**
     * Reorders the list by dragging one section onto another.
     *
     * The list is a jQuery UI sortable (`SortGroups.ts`), which only reacts to raw mouse events:
     * it starts a drag once the pointer passes its distance threshold and, under
     * `tolerance: 'pointer'`, moves the placeholder as the pointer crosses another item.
     * `locator.dragTo()` sends too few moves for either, so the drag is driven by hand and aimed
     * at the target's far edge so the dragged item lands past it rather than on top of it.
     */
    async dragSectionOnto(sourceLabel: string, targetLabel: string): Promise<void> {
        const sourceBox = await this.reorderSection(sourceLabel).boundingBox();
        const targetBox = await this.reorderSection(targetLabel).boundingBox();

        if (sourceBox == null || targetBox == null) {
            throw new Error(`cannot drag "${sourceLabel}" onto "${targetLabel}": a section is not rendered`);
        }

        const x = sourceBox.x + sourceBox.width / 2;
        const movingDown = targetBox.y > sourceBox.y;
        const targetY = movingDown ? targetBox.y + targetBox.height - 1 : targetBox.y + 1;

        await this.page.mouse.move(x, sourceBox.y + sourceBox.height / 2);
        await this.page.mouse.down();
        await this.page.mouse.move(x, targetY, {steps: 20});
        await this.page.mouse.up();
    }

    get itemsCountSections(): Locator {
        return this.modal.getByTestId('items-count-sections').getByTestId('items-count-section');
    }

    itemsCountSection(label: string): Locator {
        return this.itemsCountSections.filter({hasText: label});
    }

    maxItemsInput(label: string): Locator {
        return this.itemsCountSection(label).getByTestId('max-items-input');
    }

    async setMaxItems(label: string, maxItems: number): Promise<void> {
        const input = this.maxItemsInput(label);

        await input.fill(String(maxItems));
        await expect(input).toHaveValue(String(maxItems));
    }
}
