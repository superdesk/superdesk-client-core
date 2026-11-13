import {Locator, Page, Response, expect} from '@playwright/test';
import {Dashboard} from './dashboard';
import {Monitoring} from './monitoring';

// Every change goes through `PATCH /api/closed_desks/<desk id>`, so the mutating methods wait for it:
// the widget re-renders off the response, and a following reload would abort the request.
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
            .filter({hasText: deskName});
    }

    get info(): Locator {
        return this.page.getByTestId('desk-routing-info');
    }

    get infoRoutingTo(): Locator {
        return this.info.getByTestId('desk-routing-info--routing-to');
    }

    get infoRoutedFrom(): Locator {
        return this.info.getByTestId('desk-routing-info--routed-from');
    }

    // The indicator is always in the DOM and only toggles visibility, so an unrendered one would pass `toBeHidden`.
    async expectNoRoutingIndicated(): Promise<void> {
        await expect(this.info).toBeAttached();
        await expect(this.info).toBeHidden();
    }

    // Waits for the preferences write so a reload comes back on the same desk. Skipped when the desk is
    // already selected, because `selectDeskOrWorkspace` then sends nothing.
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

    // The reload is needed because `DashboardController.setupWorkspace` rebuilds the dashboard on a desk
    // switch, and until then the previous desk's widgets are still on screen.
    async openOn(deskName: string): Promise<void> {
        await this.page.goto('/#/workspace');
        await this.selectDesk(deskName);
        await this.page.reload();

        await expect(this.page.getByTestId('dashboard')).toBeVisible();
        await expect(this.page.getByTestId('widget-grid')).toBeAttached();

        if (await this.dashboard.getWidget('close-desk').count() === 0) {
            await this.dashboard.addWidget('close-desk');
        }

        await expect(this.widget).toBeVisible();
    }

    // URL and method only: filtering on status would turn a failed update into a timeout.
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

    async routeTo(sourceDesk: string, destinationDesk: string): Promise<void> {
        await this.openOn(sourceDesk);
        await this.selectDestination(destinationDesk);
        await this.startRouting();
    }
}
