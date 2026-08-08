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

    /**
     * Saves through the topbar Save button and waits for the save to finish, leaving the
     * article open and clean.
     *
     * Reach for it before closing when the last edit was made in an editor3 field. editor3
     * pushes a field change into the authoring model on a debounce (100ms by default), and
     * a close that beats the debounce closes the article as it was before that edit. The
     * Save button is enabled only while the model carries unsaved changes, and the topbar's
     * own `saveTopbar()` handler (`AuthoringTopbarDirective`) waits 600ms before saving the
     * item, which outlasts the debounce.
     */
    async save(): Promise<void> {
        const save = this.page.getByTestId('authoring-topbar').getByTestId('save');
        const saving = save.getByTestId('loading-indicator');

        await expect(save).toBeEnabled();
        await save.click();

        await expect(saving).toBeVisible();
        await expect(saving).toBeHidden();
        await expect(save).toBeDisabled();
    }

    /**
     * Closes an article that holds no unsaved changes, so closing raises no "Save changes?"
     * prompt. Pair it with `save()`, which leaves the article in exactly that state.
     */
    async close(): Promise<void> {
        const topbar = this.page.getByTestId('authoring-topbar');

        await topbar.getByTestId('close').click();
        await expect(topbar).toBeHidden();
    }

    /**
     * Persists the open article and closes it.
     *
     * It saves through the topbar first so that closing raises no "Save changes?" prompt.
     * Answering that prompt is not reliable under load: the click can be taken while the
     * article stays open, and on an article that has never been saved every accepted
     * prompt creates the item again.
     */
    async closeAndSave(): Promise<void> {
        await this.save();
        await this.close();
    }

    /**
     * The sidebar tab of a widget, matched on the label in its `data-test-value`.
     *
     * The label is not the tab's text: the tab renders icons and a badge only and carries
     * its label in `title` (`authoring-widgets.html`), so it cannot be filtered by text.
     */
    private widgetTab(label: string): Locator {
        return this.page.getByTestId('authoring-widget')
            .and(this.page.locator(`[data-test-value="${label}"]`));
    }

    /**
     * Opens a widget in the authoring sidebar by its label and returns its panel.
     *
     * The tab and the panel are keyed by the same label (`widget.label` lands in
     * `data-test-value` on both in `authoring-widgets.html`), so a caller never has to
     * name the widget twice.
     */
    async openWidget(label: string): Promise<Locator> {
        const panel = this.page.getByTestId('authoring-widget-panel')
            .and(this.page.locator(`[data-test-value="${label}"]`));

        await this.widgetTab(label).click();
        await expect(panel).toBeVisible();

        return panel;
    }

    /**
     * Closes the open authoring sidebar widget by clicking its tab again.
     *
     * The panel is behind an `ng-if` on the active widget, so closing removes it from the
     * DOM entirely; the tab strip is asserted first so the check cannot pass against an
     * authoring view that never rendered.
     */
    async closeWidget(label: string): Promise<void> {
        await this.widgetTab(label).click();

        await expect(this.page.getByTestId('navigation-tabs')).toBeVisible();
        await expect(this.page.getByTestId('authoring-widget-panel')).toHaveCount(0);
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
