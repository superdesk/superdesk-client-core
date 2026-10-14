import {Page, expect} from '@playwright/test';

export class MetadataSettings {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Creates a custom text field under Settings -> Metadata -> Custom text fields.
     * The field can then be added to a content profile (see
     * {@link ContentProfileSettings.addTextFieldWithLengthLimits}).
     */
    async createCustomTextField(field: {id: string; name: string}): Promise<void> {
        const {page} = this;
        const modal = page.getByTestId('vocabulary-modal');

        await page.goto('/#/settings/vocabularies');
        await page.getByTestId('metadata-tabs').getByRole('button', {name: 'Custom text fields'}).click();
        await page.getByTestId('metadata-content').getByRole('button', {name: 'Add new'}).click();

        await modal.getByLabel('id').fill(field.id);
        await modal.getByLabel('name').fill(field.name);
        await modal.getByRole('button', {name: 'Save'}).click();

        await expect(
            page.getByTestId('metadata-content').getByTestId('vocabulary-item').filter({hasText: field.name}),
        ).toBeVisible();
    }
}
