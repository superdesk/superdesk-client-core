import {Page} from '@playwright/test';
import {s} from '../utils';

export class MultiEdit {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async save(article: string): Promise<void> {
        await this.page.locator(s('multiedit-screen', `multiedit-article=${article}`)).hover();

        await this.page
            .locator(s('multiedit-screen', `multiedit-article=${article}`))
            .getByRole('button', {name: 'save'})
            .click();
    }
}
