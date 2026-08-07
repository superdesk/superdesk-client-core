import {Locator, Page, expect} from '@playwright/test';

export type IMonitoringSettingsTab = 'Desks' | 'Saved Searches' | 'Reorder Sections' | 'Items Count';

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

    tab(title: IMonitoringSettingsTab): Locator {
        return this.modal.getByTestId(`wizard--${title}`);
    }

    /**
     * The wizard marks the selected step on the `<li>` wrapping the tab button
     * (`template/wizard.html` in superdesk-ui-framework); the button itself carries no state,
     * and the template lives in a dependency so it cannot get a test id of its own.
     */
    tabWrapper(title: IMonitoringSettingsTab): Locator {
        return this.tab(title).locator('xpath=..');
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
        return toggleBox.getByTestId('saved-search').and(this.page.locator(`[data-test-value="${name}"]`));
    }

    /**
     * `sd-switch` replaces its element with `<span class="sd-toggle">` and reflects the ON
     * state as a `checked` class on that span (`app/scripts/switch.js` in
     * superdesk-ui-framework).
     */
    savedSearchToggle(toggleBox: Locator, name: string): Locator {
        return this.savedSearch(toggleBox, name).getByTestId('toggle');
    }

    async closeWithDone(): Promise<void> {
        await this.doneButton.click();
        await expect(this.modal).not.toBeVisible();
    }

    async closeWithCancel(): Promise<void> {
        await this.cancelButton.click();
        await expect(this.modal).not.toBeVisible();
    }
}
