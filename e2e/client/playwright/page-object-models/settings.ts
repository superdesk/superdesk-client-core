import {Page, Locator} from '@playwright/test';
import {s} from '../utils';

export class Settings {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async addFieldInContentProfile(contentProfile: string, tab: string, field: string): Promise<void> {
        await this.page.locator(s(`content-profile=${contentProfile}`, 'content-profile-actions')).click();
        await this.page.locator(s('content-profile-actions--options')).getByRole('button', {name: 'Edit'}).click();

        await this.page
            .locator(s('content-profile-editing-modal', 'content-profile-tabs'))
            .getByRole('tab', {name: `${tab} fields`}).click();
        await this.page
            .locator(s('content-profile-editing-modal'))
            .getByRole('button', {name: 'Add new field'}).first().click();
        await this.page.locator(s('tree-menu-popover')).getByRole('button', {name: field}).click();

        await this.page.locator(s('item-view-edit', 'gform-input--sdWidth')).selectOption('full');
        await this.page.locator(s('item-view-edit')).getByRole('button', {name: 'apply'}).click();
    }
}
