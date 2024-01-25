import {Page, expect} from '@playwright/test';
import {s} from '../utils';

export class Monitoring {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async selectDesk(deskName: string) {
        const deskSelectDropdown = this.page.locator(s('monitoring--selected-desk'));

        const selectedDeskText = await deskSelectDropdown.textContent();

        if (selectedDeskText.toLocaleLowerCase().includes(deskName.toLocaleLowerCase()) !== true) {
            await deskSelectDropdown.click();
            await this.page.locator(s('monitoring--select-desk-options', 'item'), {hasText: deskName}).click();
        }
    }
}
