import {Locator, Page, Response, expect} from '@playwright/test';
import {Dashboard} from './dashboard';
import {Monitoring} from './monitoring';

/**
 * The "Desk Router" dashboard widget (`close-desk`) and the top-menu indicator
 * that mirrors it.
 *
 * Both read the current desk's `is_closed` / `closed_destination` fields.
 * Every change goes through `PATCH /api/closed_desks/<desk id>`
 * (scripts/apps/dashboard/closed-desk/index.ts), so the mutating methods here
 * wait for that request before returning: the widget re-renders off the
 * response body, and a following reload would otherwise abort the request.
 */
export class DeskRouting {
    private page: Page;
    private dashboard: Dashboard;
    private monitoring: Monitoring;

    constructor(page: Page) {
        this.page = page;
        this.dashboard = new Dashboard(page);
        this.monitoring = new Monitoring(page);
    }

    get widget(): Locator {
        return this.page.getByTestId('desk-router');
    }

    get destinationSelect(): Locator {
        return this.widget.getByTestId('desk-router-destination');
    }

    /** The selected option of the destination `<select>`; its text is the desk name. */
    get selectedDestination(): Locator {
        return this.destinationSelect.locator('option:checked');
    }

    get startButton(): Locator {
        return this.widget.getByTestId('desk-router-start');
    }

    get stopButton(): Locator {
        return this.widget.getByTestId('desk-router-stop');
    }

    get routedFromList(): Locator {
        return this.widget.getByTestId('desk-router-routed-from');
    }

    routedFromItem(deskName: string): Locator {
        return this.routedFromList
            .getByTestId('desk-router-routed-from-item')
            .and(this.page.locator(`[data-test-value="${deskName}"]`));
    }

    /** The top-menu indicator, rendered next to the global menu on every route. */
    get info(): Locator {
        return this.page.getByTestId('desk-routing-info');
    }

    get infoRoutingTo(): Locator {
        return this.info.getByTestId('desk-routing-info--routing-to');
    }

    get infoRoutedFrom(): Locator {
        return this.info.getByTestId('desk-routing-info--routed-from');
    }

    /**
     * Asserts that neither direction is reported. The indicator is always in
     * the DOM and only toggles its visibility, so it is checked for being
     * present first: an unrendered indicator would satisfy `toBeHidden` too.
     */
    async expectNoRoutingIndicated(): Promise<void> {
        await expect(this.info).toBeAttached();
        await expect(this.info).toBeHidden();
    }

    /**
     * Switches desks and waits for the preference write that records the
     * choice, so that a reload comes back on the same desk. One request covers
     * it: `preferencesService` batches every update made in a digest into a
     * single `PATCH /preferences/<session>`.
     *
     * `selectDeskOrWorkspace` does nothing when the desk is already selected,
     * and then there is no write to wait for, hence the check first.
     */
    private async selectDesk(deskName: string): Promise<void> {
        const deskSelector = this.page.getByTestId('monitoring--selected-desk');

        await expect(deskSelector).toBeVisible();

        const selected = await deskSelector.textContent() ?? '';

        if (selected.toLocaleLowerCase().includes(deskName.toLocaleLowerCase())) {
            return;
        }

        await Promise.all([
            this.page.waitForResponse(
                (candidate: Response) => /\/preferences\/[^/]+$/.test(candidate.url())
                    && candidate.request().method() === 'PATCH',
            ),
            this.monitoring.selectDeskOrWorkspace(deskName),
        ]);
    }

    /**
     * Opens the dashboard of `deskName` with the Desk Router widget on it. Each
     * desk has a dashboard of its own, so the widget has to be added per desk.
     *
     * The reload is what makes the widget lookup below trustworthy: on a desk
     * switch `DashboardController.setupWorkspace` drops the dashboard and
     * rebuilds it in a later digest, so between the two the previous desk's
     * widgets are still on screen and would be read as this desk's.
     */
    async openOn(deskName: string): Promise<void> {
        await this.page.goto('/#/workspace');
        await this.selectDesk(deskName);
        await this.page.reload();

        await expect(this.page.getByTestId('dashboard')).toBeVisible();
        // The grid has to be there before the widget count below can mean anything.
        await expect(this.page.getByTestId('widget-grid')).toBeAttached();

        if (await this.dashboard.getWidget('close-desk').count() === 0) {
            await this.dashboard.addWidget('close-desk');
        }

        await expect(this.widget).toBeVisible();
    }

    /**
     * Matches on URL and method only. A predicate that also required a 2xx
     * would never match a rejected update, turning a reportable failure into an
     * opaque `waitForResponse` timeout; the status is asserted once the
     * response has arrived.
     */
    private async expectDeskUpdated(trigger: Promise<unknown>): Promise<void> {
        const [response] = await Promise.all([
            this.page.waitForResponse(
                (candidate: Response) => /\/closed_desks\/[^/]+$/.test(candidate.url())
                    && candidate.request().method() === 'PATCH',
            ),
            trigger,
        ]);

        expect(response.ok(), `updating the desk routing failed with ${response.status()}`).toBe(true);
    }

    async selectDestination(deskName: string): Promise<void> {
        await this.expectDeskUpdated(this.destinationSelect.selectOption({label: deskName}));
    }

    async startRouting(): Promise<void> {
        await this.expectDeskUpdated(this.startButton.click());
        await expect(this.stopButton).toBeVisible();
    }

    async stopRouting(): Promise<void> {
        await this.expectDeskUpdated(this.stopButton.click());
        await expect(this.startButton).toBeVisible();
    }

    /** Sets a destination and starts routing in one step, for preconditions. */
    async routeTo(sourceDesk: string, destinationDesk: string): Promise<void> {
        await this.openOn(sourceDesk);
        await this.selectDestination(destinationDesk);
        await this.startRouting();
    }
}
