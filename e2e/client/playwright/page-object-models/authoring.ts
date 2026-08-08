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
     * Closes an edited article through the "Save changes?" prompt that closing raises,
     * which both persists the changes and closes the article. The prompt's Save is
     * scoped to the dialog so it does not collide with the topbar Save button.
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
