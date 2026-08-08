import {Locator, Page, expect} from '@playwright/test';
import {s} from '../utils';
import {TreeSelectDriver} from '../utils/tree-select-driver';

export class Authoring {
    protected page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async executeActionInEditor(...actionPath: Array<string>): Promise<void> {
        const {page} = this;

        await page.locator(s('authoring-topbar', 'actions-button')).click();

        const actionsWithoutLast = actionPath.slice(0, actionPath.length - 1);

        for (const action of actionsWithoutLast) {
            await page.locator(s('actions-list')).getByRole('button', {name: action}).hover();
        }

        await page.locator(s('actions-list'))
            .getByRole('button', {name: actionPath[actionPath.length - 1]})
            .click();
    }

    async publish(options: {subscribers: Array<string>}): Promise<void> {
        const {page} = this;

        await page.locator(s('authoring', 'open-send-publish-pane')).click();

        if (options.subscribers.length > 0) {
            await new TreeSelectDriver(
                page,
                page.locator(s('target-subscribers')),
            ).setValues(options.subscribers);
        }

        await page.locator(s('authoring', 'interactive-actions-panel', 'publish')).click();

        if (options.subscribers.length > 0) {
            await page.locator(s('modal-confirm')).getByRole('button', {name: 'save and send'}).click();
        }
    }

    async sendTo(destination: {desk: string; stage: string}): Promise<void> {
        const {page} = this;

        await page.locator(s('authoring-topbar', 'open-send-publish-pane')).click();
        await page.locator(s('interactive-actions-panel', 'tabs')).getByRole('tab', {name: 'Send to'}).click();

        await new TreeSelectDriver(
            page,
            page.locator(s('destination-select')),
        ).setValues(destination.desk);

        await page
            .locator(s('interactive-actions-panel', 'stage-select'))
            .getByRole('radio', {name: destination.stage})
            .check();

        await page.locator(s('interactive-actions-panel', 'send')).click();
    }

    /**
     * Saves from the topbar and waits for the save to land.
     *
     * The Save button is also disabled while the save is in flight, so it being
     * disabled says nothing about the item having been persisted. The spinner
     * inside the button is the completion signal: it is bound to the same flag
     * the save promise clears when it settles.
     */
    async save(): Promise<void> {
        const saveButton = this.page.getByTestId('authoring-topbar').getByTestId('save');
        const spinner = saveButton.getByTestId('loading-indicator');

        await saveButton.click();
        await expect(spinner).toBeVisible();
        await expect(spinner).toBeHidden();
        await expect(saveButton).toBeDisabled();
    }

    /**
     * Closes an article that has nothing left to save.
     *
     * There is no way to assert the "Save changes?" prompt stays away by looking
     * for its absence, since it is absent for a moment either way. The topbar
     * hiding is the assertion that carries it: while the prompt is up the article
     * stays open, so a prompt here fails this method rather than being clicked
     * away. Use `closeDiscardingChanges` when unsaved edits are expected.
     */
    async close(): Promise<void> {
        const {page} = this;
        const topbar = page.getByTestId('authoring-topbar');

        await topbar.getByTestId('close').click();

        await expect(topbar).toBeHidden();
        await expect(page.getByTestId('unsaved-changes-dialog')).toBeHidden();
    }

    /**
     * Closes the article, discarding an autosave record if one is pending.
     *
     * Fields that autosave on a debounce can land a record after the item was
     * saved, and the item then still counts as unsaved on the next close even
     * if nothing was touched since. That makes the "Save changes?" prompt
     * genuinely optional here, so it is answered only when it shows up.
     */
    async closeDiscardingChanges(): Promise<void> {
        const {page} = this;
        const topbar = page.getByTestId('authoring-topbar');
        const unsavedChanges = page.getByTestId('unsaved-changes-dialog');

        await topbar.getByTestId('close').click();

        await expect(async () => {
            if (await unsavedChanges.isVisible()) {
                await unsavedChanges.getByRole('button', {name: 'Ignore', exact: true}).click();
            }

            await expect(topbar).toBeHidden({timeout: 1000});
        }).toPass({timeout: 20000});
    }

    /**
     * Closes an article that has pending edits, answering the "Save changes?"
     * prompt with Save.
     *
     * Use this instead of `save()` + `close()` after editing fields that
     * autosave on a debounce: the debounced autosave can land after the topbar
     * save, which raises the prompt anyway and leaves `close()` hanging on an
     * article that never closes.
     */
    async closeAndSave(): Promise<void> {
        const {page} = this;

        await page.getByTestId('authoring-topbar').getByTestId('close').click();

        await page.getByTestId('unsaved-changes-dialog')
            .getByRole('button', {name: 'Save', exact: true})
            .click();

        await expect(page.getByTestId('authoring-topbar')).toBeHidden();
    }

    /**
     * editor3 field takes quite some time to initialize in authoring-react.
     * Until it initializes - typing inside it doesn't update `fieldsData` in authoring-react state.
     */
    public async waitForAuthoringReactToInitialize() {
        await this.page.waitForTimeout(2000);
    }

    field(field: string): Locator {
        return this.page.locator(s('authoring', field)).getByRole('textbox');
    }

    /**
     * Opens the authoring-react "Save as template" modal, fills the name and saves.
     * Menu items render in a portal outside the actions wrapper, so locate them by
     * role/text rather than a test-id chain.
     */
    async saveAsTemplate(templateName: string): Promise<void> {
        const {page} = this;
        const modal = page.getByTestId('modal-save-as-template');

        await page.getByRole('button', {name: 'Actions menu'}).click();
        await page.getByText('Save as template', {exact: true}).click();
        await expect(modal).toBeVisible();

        await modal.getByLabel('Template name').fill(templateName);
        await modal.getByRole('button', {name: 'Save'}).click();
        await expect(modal).not.toBeVisible();
    }
}

export class PictureAuthoring extends Authoring {
    async openMetadataEditor(): Promise<void> {
        await this.page.locator(s('authoring-field=media', 'image-overlay')).hover();
        await this.page.locator(s('authoring-field=media', 'edit-metadata')).click();
    }
}
