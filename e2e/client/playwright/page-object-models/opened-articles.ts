import {Locator, Page, expect} from '@playwright/test';

/**
 * The bar at the bottom of the workspace listing the articles the current user
 * has open, and the fullscreen "Currently working on" view its Open Items icon
 * opens.
 */
export class OpenedArticles {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    getBar(): Locator {
        return this.page.getByTestId('opened-articles-bar');
    }

    getOpenItemsIcon(): Locator {
        return this.getBar().getByTestId('open-items');
    }

    getBarItems(): Locator {
        return this.getBar().getByTestId('item');
    }

    /**
     * Bar entries are labelled with the article's headline, falling back to its
     * slugline and then to "Untitled".
     */
    getBarItem(label: string): Locator {
        return this.getBarItems().filter({hasText: label});
    }

    /**
     * sd-modal moves the dialog to <body>, so it is not a descendant of the
     * workqueue bar; locate it from the page root.
     */
    getDashboard(): Locator {
        return this.page.getByTestId('opened-articles-dashboard');
    }

    getDashboardItems(): Locator {
        return this.getDashboard().getByTestId('item');
    }

    /**
     * Dashboard cards are labelled with the article's headline only, and show
     * "Untitled" when there is none, so only articles that have a headline can
     * be picked out this way.
     */
    getDashboardItem(headline: string): Locator {
        return this.getDashboardItems().filter({hasText: headline});
    }

    async openDashboard(): Promise<void> {
        await this.getOpenItemsIcon().click();
        await expect(this.getDashboard()).toBeVisible();
    }

    async closeDashboard(): Promise<void> {
        await this.getDashboard().getByTestId('close').click();
        await expect(this.getDashboard()).not.toBeVisible();
    }
}
