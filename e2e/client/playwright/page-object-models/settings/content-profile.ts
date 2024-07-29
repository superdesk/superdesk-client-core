import {Page, expect} from '@playwright/test';
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

        await new TreeSelectDriver(
            this.page,
            this.page.locator(s('formatting-options-input')),
        ).setValue(options.formattingOptionsToAdd);

        // this is required for validation. TODO: update DB snapshot to make current items already valid
        await this.page.locator(s('generic-list-page', 'item-view-edit', 'gform-input--sdWidth')).selectOption('Full');

        await this.page.locator(s('generic-list-page', 'item-view-edit', 'toolbar'))
            .getByRole('button', {name: 'Apply'})
            .click();

        await this.page.locator(s('content-profile-edit-view--footer')).getByRole('button', {name: 'Save'}).click();

        // wait for saving to finish and modal to close
        await expect(this.page.locator(s('content-profile-edit-view'))).not.toBeVisible();
    }

    async addFieldsToContentProfile(
        contentProfile: string,
        fields: Array<{tabName: string; fieldId: string}>,
    ): Promise<void> {
        await this.page.locator(s(`content-profile=${contentProfile}`, 'content-profile-actions')).click();
        await this.page.locator(s('content-profile-actions--options')).getByRole('button', {name: 'Edit'}).click();

        for (const field of fields) {
            await this.page
                .locator(s('content-profile-editing-modal', 'content-profile-tabs'))
                .getByRole('tab', {name: `${field.tabName} fields`}).click();
            await this.page
                .locator(s('content-profile-editing-modal'))
                .getByRole('button', {name: 'Add new field'}).first().click();
            await this.page.locator(s('tree-menu-popover')).getByRole('button', {name: field.fieldId}).click();

            await this.page.locator(s('item-view-edit', 'gform-input--sdWidth')).selectOption('full');
            await this.page.locator(s('item-view-edit')).getByRole('button', {name: 'apply'}).click();

            await expect(
                this.page.locator(s('content-profile-editing-modal', `content-profile-item=${field.fieldId}`)),
            ).toBeVisible();
        }

        await this.page.locator(s('content-profile-editing-modal')).getByRole('button', {name: 'Save'}).click();
    }
}
