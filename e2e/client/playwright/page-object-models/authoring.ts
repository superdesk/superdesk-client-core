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
     * Opens a side widget by its label and returns the widget panel.
     *
     * Both the tab and the panel carry the label in `data-test-value` while their
     * visible content is an icon, so they are matched on the attribute.
     */
    async openWidget(label: string): Promise<Locator> {
        const {page} = this;

        await page.getByTestId('authoring-widget')
            .and(page.locator(`[data-test-value="${label}"]`))
            .click();

        const panel = page.getByTestId('authoring-widget-panel')
            .and(page.locator(`[data-test-value="${label}"]`));

        await expect(panel).toBeVisible();

        return panel;
    }

    /**
     * Saves from the topbar and waits for the save to land.
     *
     * The Save button is disabled while the item is clean, so it going back to
     * disabled is the completion signal; without it the next assertion can run
     * against a not-yet-persisted item.
     */
    async save(): Promise<void> {
        const saveButton = this.page.getByTestId('authoring-topbar').getByTestId('save');

        await saveButton.click();
        await expect(saveButton).toBeDisabled();
    }

    /**
     * Closes the article, discarding an autosave record if one is pending.
     *
     * Fields that autosave on a debounce can land a record after the item was
     * saved, and the item then still counts as unsaved on the next close even
     * if nothing was touched since. That makes the "Save changes?" prompt
     * genuinely optional here, so it is answered only when it shows up.
     */
    async close(): Promise<void> {
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
     * Opens the send/publish pane and returns it. Which tabs it offers depends on
     * the article, so the caller decides what to assert or click.
     */
    async openSendPublishPane(): Promise<Locator> {
        const {page} = this;

        await page.getByTestId('authoring-topbar').getByTestId('open-send-publish-pane').click();

        const panel = page.getByTestId('interactive-actions-panel');

        await expect(panel).toBeVisible();

        return panel;
    }

    async closeSendPublishPane(): Promise<void> {
        const panel = this.page.getByTestId('interactive-actions-panel');

        await panel.getByTestId('close').click();
        await expect(panel).toBeHidden();
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
