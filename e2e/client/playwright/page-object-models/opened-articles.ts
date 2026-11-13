import {Locator, Page, expect} from '@playwright/test';

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

    getBarItem(label: string): Locator {
        return this.getBarItems().filter({hasText: label});
    }

    // sd-modal moves the dialog to <body>, so locate it from the page root.
    getDashboard(): Locator {
        return this.page.getByTestId('opened-articles-dashboard');
    }

    getDashboardItems(): Locator {
        return this.getDashboard().getByTestId('item');
    }

    // Cards show the headline only ("Untitled" when missing), so headline-less articles cannot be matched.
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
