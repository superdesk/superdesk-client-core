import {Page, Locator, expect} from '@playwright/test';

export interface ICustomFieldValues {
    id?: string;
    name?: string;
    fieldTypeLabel?: string;
    description?: string;
    helperText?: string;
}

export class MetadataSettings {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async openTab(tabName: string): Promise<void> {
        await this.page.goto('/#/settings/vocabularies');
        await this.page.getByTestId('metadata-tabs').getByRole('button', {name: tabName}).click();
        await expect(this.getAddNewButton()).toBeVisible();
    }

    getAddNewButton(): Locator {
        return this.page.getByTestId('metadata-content').getByRole('button', {name: 'Add new'});
    }

    getListItem(name: string): Locator {
        return this.page.getByTestId('metadata-content').getByTestId('vocabulary-item').filter({hasText: name});
    }

    getDialog(): Locator {
        return this.page.getByTestId('vocabulary-modal');
    }

    getSaveButton(): Locator {
        return this.getDialog().getByTestId('vocabulary-edit-modal--save');
    }

    async openCreateDialog(): Promise<void> {
        await this.getAddNewButton().click();
        await expect(this.getDialog()).toBeVisible();
    }

    async openEditDialog(name: string): Promise<void> {
        const item = this.getListItem(name);

        await item.hover();
        await item.getByTestId('vocabulary-item--start-editing').click();
        await expect(this.getDialog()).toBeVisible();
    }

    async openDeletionModal(name: string): Promise<void> {
        const item = this.getListItem(name);

        await item.hover();
        await item.getByTestId('vocabulary-item--start-removing').click();
    }

    async fillDialog(values: ICustomFieldValues): Promise<void> {
        const dialog = this.getDialog();

        if (values.fieldTypeLabel != null) {
            await dialog.getByLabel('Field type').selectOption({label: values.fieldTypeLabel});
        }

        if (values.id != null) {
            await this.page.getByTestId('vocabulary-edit--id').fill(values.id);
        }

        if (values.name != null) {
            await this.page.getByTestId('vocabulary-edit-field--name').fill(values.name);
        }

        if (values.description != null) {
            await dialog.getByLabel('Description').fill(values.description);
        }

        if (values.helperText != null) {
            await dialog.getByLabel('Helper text').fill(values.helperText);
        }
    }

    // Only the inputs every tab has; "Field type" exists on "Other fields" only.
    async readSharedDialogValues(): Promise<Required<Omit<ICustomFieldValues, 'fieldTypeLabel'>>> {
        const dialog = this.getDialog();

        return {
            id: await this.page.getByTestId('vocabulary-edit--id').inputValue(),
            name: await this.page.getByTestId('vocabulary-edit-field--name').inputValue(),
            description: await dialog.getByLabel('Description').inputValue(),
            helperText: await dialog.getByLabel('Helper text').inputValue(),
        };
    }

    async readDialogValues(): Promise<Required<Omit<ICustomFieldValues, 'fieldTypeLabel'>> & {fieldType: string}> {
        return {
            ...await this.readSharedDialogValues(),
            fieldType: await this.getDialog().getByLabel('Field type').inputValue(),
        };
    }

    // Waits for the write Save triggers, so a following reload cannot race it.
    async save(): Promise<void> {
        await Promise.all([
            this.page.waitForResponse(
                (response) => response.url().includes('/api/vocabularies')
                    && ['POST', 'PATCH'].includes(response.request().method()),
            ),
            this.getSaveButton().click(),
        ]);
        await expect(this.getDialog()).toHaveCount(0);
    }

    async cancel(): Promise<void> {
        await this.getDialog().getByTestId('vocabulary-edit-modal--cancel').click();
        await expect(this.getDialog()).toHaveCount(0);
    }

    async closeWithIcon(): Promise<void> {
        await this.getDialog().getByTestId('vocabulary-edit-modal--close').click();
        await expect(this.getDialog()).toHaveCount(0);
    }

    // The `main` snapshot has no custom fields and there is no fixture API, so tests build theirs
    // here (the atomic-precondition exception in e2e/WRITING_TESTS.md).
    async createCustomField(
        values: ICustomFieldValues & {id: string; name: string},
        configureDialog?: () => Promise<void>,
    ): Promise<void> {
        await this.openCreateDialog();
        await this.fillDialog(values);
        await configureDialog?.();
        await this.save();
        await expect(this.getListItem(values.name)).toBeVisible();
    }

    // Save stays disabled until one type is ticked (`requireAllowedTypesSelection`). The controls
    // are `sd-check` spans, not checkbox inputs, so click rather than check.
    async setAllowedContentTypes(typeLabels: Array<string>): Promise<void> {
        for (const typeLabel of typeLabels) {
            await this.getDialog().getByLabel(typeLabel).click();
        }
    }

    getDeletionModal(): Locator {
        return this.page.getByTestId('vocabulary-deletion-modal--can-delete');
    }

    getDeletionRefusal(): Locator {
        return this.page.getByTestId('vocabulary-deletion-modal--cannot-delete');
    }

    // Waits for the DELETE the confirmation triggers.
    async confirmDeletion(fieldId: string): Promise<void> {
        await Promise.all([
            this.page.waitForResponse(
                (response) => response.url().includes(`/api/vocabularies/${fieldId}`)
                    && response.request().method() === 'DELETE',
            ),
            this.getDeletionModal().getByRole('button', {name: 'Delete'}).click(),
        ]);
        await expect(this.getDeletionModal()).toHaveCount(0);
    }
}
