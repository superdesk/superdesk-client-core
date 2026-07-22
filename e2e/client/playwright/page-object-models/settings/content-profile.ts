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
        ).setValues(options.formattingOptionsToAdd);

        // this is required for validation. TODO: update DB snapshot to make current items already valid
        await this.page.locator(s('generic-list-page', 'item-view-edit', 'gform-input--sdWidth')).selectOption('Full');

        await this.page.locator(s('generic-list-page', 'item-view-edit', 'toolbar'))
            .getByRole('button', {name: 'Apply'})
            .click();

        await this.page.locator(s('content-profile-edit-view--footer')).getByRole('button', {name: 'Save'}).click();

        await expect(this.page.locator(s('content-profile-edit-view'))).not.toBeVisible();
    }

    /**
     * Adds an existing custom text field to a content profile and sets its
     * character-length limits (Minimum / Maximum length). getByTestId-based
     * (current convention), unlike the sibling s()-based helpers above.
     */
    async addTextFieldWithLengthLimits(options: {
        profileName: string;
        tabName: string;
        fieldName: string;
        minLength: number;
        maxLength: number;
    }): Promise<void> {
        const {page} = this;
        const card = page.getByTestId('content-profile')
            .and(page.locator(`[data-test-value="${options.profileName}"]`));

        await page.goto('/#/settings/content-profiles');
        await card.getByTestId('content-profile-actions').click();
        await page.getByTestId('content-profile-actions--options').getByRole('button', {name: 'Edit'}).click();

        const editModal = page.getByTestId('content-profile-editing-modal');

        await editModal.getByTestId('content-profile-tabs')
            .getByRole('tab', {name: `${options.tabName} fields`}).click();
        await editModal.getByRole('button', {name: 'Add new field'}).first().click();
        await page.getByTestId('tree-menu-popover')
            .getByRole('treeitem', {name: `${options.fieldName} (text)`, exact: true}).click();

        const fieldEdit = page.getByTestId('item-view-edit');

        await fieldEdit.getByTestId('gform-input--minlength').fill(String(options.minLength));
        await fieldEdit.getByTestId('gform-input--maxlength').fill(String(options.maxLength));
        await fieldEdit.getByTestId('gform-input--sdWidth').selectOption('full');
        await fieldEdit.getByRole('button', {name: 'apply'}).click();

        await editModal.getByRole('button', {name: 'Save'}).click();
        await expect(editModal).not.toBeVisible();
    }

    async addFieldsToContentProfile(
        contentProfile: string,
        fields: Array<{tabName: string; fieldId: string, fieldType?: string}>,
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
            await this.page
                .locator(s('tree-menu-popover'))
                .getByRole(
                    'treeitem',
                    {name: field.fieldType ? `${field.fieldId} (${field.fieldType})` : field.fieldId, exact: true},
                )
                .click();

            await this.page.locator(s('item-view-edit', 'gform-input--sdWidth')).selectOption('full');
            await this.page.locator(s('item-view-edit')).getByRole('button', {name: 'apply'}).click();

            await expect(
                this.page.locator(s('content-profile-editing-modal', `content-profile-item=${field.fieldId}`)),
            ).toBeVisible();
        }

        await this.page.locator(s('content-profile-editing-modal')).getByRole('button', {name: 'Save'}).click();
    }
}
