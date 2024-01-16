import {Page} from '@playwright/test';
import {s} from '../utils';

export class Monitoring {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async selectDesk(deskName: string) {
        await this.page.locator(s('monitoring--selected-desk')).click();
        await this.page.locator(s('monitoring--select-desk-options', 'item'), {hasText: deskName}).click();
    }
}
