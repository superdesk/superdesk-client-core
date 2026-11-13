import {Page, Locator, expect} from '@playwright/test';
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

    // The list replaces the field's existing formatting options, it is not merged.
    public async addFormattingOptionToContentProfile(options: IOptions) {
        await this.page.locator(s(`content-profile=${options.profileName}`))
            .getByRole('button', {name: 'Actions'})
            .click();
        await this.page.locator(s('content-profile-actions-popover')).getByRole('button', {name: 'Edit'}).click();

        await this.page.locator(s('content-profile-edit-view')).getByRole('tab', {name: options.sectionName}).click();
        await this.page.locator(s('content-profile-edit-view', `field=${options.fieldName}`)).click();

        // Spread, not passed as one array: an array argument is a nested path for
        // TreeSelectDriver, and the tree-select popover closes after every pick, so all
        // options but the first would be clicked against a popover that is no longer open.
        await new TreeSelectDriver(
            this.page,
            this.page.locator(s('formatting-options-input')),
        ).setValues(...options.formattingOptionsToAdd);

        // this is required for validation. TODO: update DB snapshot to make current items already valid
        await this.page.locator(s('generic-list-page', 'item-view-edit', 'gform-input--sdWidth')).selectOption('Full');

        await this.page.locator(s('generic-list-page', 'item-view-edit', 'toolbar'))
            .getByRole('button', {name: 'Apply'})
            .click();

        await this.page.locator(s('content-profile-edit-view--footer')).getByRole('button', {name: 'Save'}).click();

        await expect(this.page.locator(s('content-profile-edit-view'))).not.toBeVisible();
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

    // Unlike `addFieldsToContentProfile`, waits for the PATCH Save triggers.
    async addFieldsToContentProfileAndWait(
        contentProfile: string,
        fields: Array<{tabName: string; fieldId: string, fieldType?: string}>,
    ): Promise<void> {
        await Promise.all([
            this.page.waitForResponse(
                (response) => response.url().includes('/api/content_types/')
                    && response.request().method() === 'PATCH',
            ),
            this.addFieldsToContentProfile(contentProfile, fields),
        ]);

        // sd-modal keeps its element in the DOM once opened, so closure shows as hidden, not absent.
        await expect(this.page.getByTestId('content-profile-editing-modal')).toBeHidden();
    }

    async openEditor(contentProfile: string): Promise<void> {
        await this.page
            .getByTestId('content-profile')
            .and(this.page.locator(`[data-test-value="${contentProfile}"]`))
            .getByTestId('content-profile-actions')
            .click();
        await this.page
            .getByTestId('content-profile-actions--options')
            .getByRole('button', {name: 'Edit'})
            .click();
        await expect(this.page.getByTestId('content-profile-editing-modal')).toBeVisible();
    }

    // `sectionName` is the tab label without the " fields" suffix.
    async openSection(sectionName: string): Promise<void> {
        await this.page
            .getByTestId('content-profile-editing-modal')
            .getByTestId('content-profile-tabs')
            .getByRole('tab', {name: `${sectionName} fields`})
            .click();
    }

    getConfiguredField(fieldName: string): Locator {
        return this.page
            .getByTestId('content-profile-editing-modal')
            .getByTestId('content-profile-item')
            .and(this.page.locator(`[data-test-value="${fieldName}"]`));
    }

    async openFieldPicker(): Promise<Locator> {
        await this.page
            .getByTestId('content-profile-editing-modal')
            .getByRole('button', {name: 'Add new field'})
            .first()
            .click();

        // The popover is a zero-size portal wrapper (TreeMenu in superdesk-ui-framework), never
        // visible itself; wait on its options.
        const popover = this.page.getByTestId('tree-menu-popover');

        await expect(popover.getByRole('treeitem').first()).toBeVisible();

        return popover;
    }
}
