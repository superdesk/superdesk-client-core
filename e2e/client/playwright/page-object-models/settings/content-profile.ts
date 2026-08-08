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

    /**
     * Adds formatting options to one field of a content profile, keeping the options it already
     * has. `sectionName` is a tab label ('Header fields', 'Content fields'), `fieldName` the
     * field's display name ('Body HTML').
     */
    public async addFormattingOptionToContentProfile(options: IOptions) {
        const editModal = this.page.getByTestId('content-profile-editing-modal');

        await this.page.getByTestId('content-profile')
            .and(this.page.locator(`[data-test-value="${options.profileName}"]`))
            .getByTestId('content-profile-actions')
            .click();
        await this.page.getByTestId('content-profile-actions--options')
            .getByRole('button', {name: 'Edit'})
            .click();

        await editModal.getByTestId('content-profile-tabs')
            .getByRole('tab', {name: options.sectionName})
            .click();
        await editModal.getByTestId('content-profile-fields')
            .getByTestId('field')
            .and(this.page.locator(`[data-test-value="${options.fieldName}"]`))
            .click();

        const fieldEdit = this.page.getByTestId('item-view-edit');

        await expect(fieldEdit).toBeVisible();

        await new TreeSelectDriver(
            this.page,
            fieldEdit.getByTestId('formatting-options-input'),
        ).addValues(...options.formattingOptionsToAdd);

        await fieldEdit.getByTestId('item-view-edit--save').click();

        // Applying a field edit is rejected silently when a field the form marks as required has
        // no value (`sdWidth` is one). The panel leaving edit mode is the only signal that the
        // edit was taken; without this check a rejected Apply surfaces one step later, as a
        // timeout on the modal's Save button, which stays disabled while the form is not dirty.
        await expect(fieldEdit.getByTestId('item-view-edit--save')).toBeHidden();

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
