import {Page} from '@playwright/test';
import {s} from '../../utils';
import {TreeSelectDriver} from '../../utils/tree-select-driver';

interface IOptions {
    profileName: string;
    sectionName: string;
    fieldName: string;
    formattingOptionsToAdd: Array<string>;
}

export class ContentProfileSettings {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    public async addFormattingOptionToContentProfile(options: IOptions) {
        await this.page.locator(s(`content-profile=${options.profileName}`))
            .getByRole('button', {name: 'Actions'})
            .click();
        await this.page.locator(s('content-profile-actions-popover')).getByRole('button', {name: 'Edit'}).click();

        await this.page.locator(s('content-profile-edit-view')).getByRole('tab', {name: options.sectionName}).click();
        await this.page.locator(s('content-profile-edit-view', `field=${options.fieldName}`)).click();

        for (const option of options.formattingOptionsToAdd) {
            await new TreeSelectDriver(
                this.page,
                this.page.locator(s('formatting-options-input')),
            ).addValue(option);
        }

        // this is required for validation. TODO: update DB snapshot to make current items already valid
        await this.page.locator(s('generic-list-page', 'item-view-edit', 'gform-input--sdWidth')).selectOption('Full');

        await this.page.locator(s('generic-list-page', 'item-view-edit', 'toolbar'))
            .getByRole('button', {name: 'Apply'})
            .click();

        await this.page.locator(s('content-profile-edit-view--footer')).getByRole('button', {name: 'Save'}).click();
    }
}
