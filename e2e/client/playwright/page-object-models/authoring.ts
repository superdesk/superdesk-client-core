import {Locator, Page, expect} from '@playwright/test';
import {s} from '../utils';
import {TreeSelectDriver} from '../utils/tree-select-driver';

/**
 * Class editor3 puts on a toolbar formatting button while the style is on at the caret.
 * Matched as a pattern because it is one of several classes on the element.
 */
export const ACTIVE_FORMATTING_BUTTON = /Editor3-activeButton/;

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
     * Closes the article and saves through the "Save changes?" prompt that closing an
     * edited article raises, which both persists the changes and closes the article.
     * The prompt's Save is scoped to the dialog so it does not collide with the topbar
     * Save button.
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
     * Closes the opened article and waits for the editor to be gone, so that a following
     * interaction with the monitoring list underneath does not race the closing pane.
     */
    async close(): Promise<void> {
        await this.page.getByTestId('authoring-topbar').getByTestId('close').click();

        await expect(this.page.getByTestId('authoring')).toBeHidden();
    }

    /**
     * Saves through the topbar Save button and waits for the write to finish.
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

    field(field: string): Locator {
        return this.page.locator(s('authoring', field)).getByRole('textbox');
    }

    /**
     * Replaces the content of an editor3 (Draft.js) field. A single `fill` sometimes
     * applies only part of the replacement to a Draft.js field, so the result is verified
     * and the fill retried until the field holds exactly the requested text. Typing via
     * real key events is not an alternative: with the send/publish panel open, keystrokes
     * do not reach the editor, while `fill` forces focus on the field itself.
     */
    async replaceEditor3FieldText(field: Locator, text: string): Promise<void> {
        await expect(async () => {
            await field.fill(text);
            await expect(field).toHaveText(text, {timeout: 1000});
        }).toPass();
    }

    /**
     * The whole authoring field for a schema field id ('body_html'), as opposed to `field()`
     * which returns the editable element inside it. An editor3 field renders its toolbar and its
     * rendered blocks as siblings of that element, so anything but plain typing needs the wrapper.
     */
    fieldContainer(fieldId: string): Locator {
        return this.page.getByTestId('authoring')
            .getByTestId('authoring-field')
            .and(this.page.locator(`[data-test-value="${fieldId}"]`));
    }

    /**
     * The authoring field of a media association, addressed by its `data-test-value`:
     * the schema id for built-in fields ('feature_media'), the display name for custom
     * ones ('Shire gallery'). Association fields hold a placeholder button, a media
     * figure and metadata inputs rather than a single control, so unlike `field` this
     * returns the field itself and leaves picking what is inside it to the caller.
     * Same element as `fieldContainer`; the name states what the callers read it as.
     */
    associationField(fieldId: string): Locator {
        return this.fieldContainer(fieldId);
    }

    /**
     * A button in an editor3 field's toolbar, addressed by the formatting option it applies
     * ('bold', 'ordered list'), which is the name the content profile uses for it too.
     */
    formattingOptionButton(fieldId: string, option: string): Locator {
        return this.fieldContainer(fieldId)
            .getByTestId('toolbar')
            .getByTestId('formatting-option-button')
            .and(this.page.locator(`[data-test-value="${option}"]`));
    }

    /**
     * Closes an edited article through the "Save changes?" prompt that closing raises, which both
     * persists the changes and closes the article. The prompt's Save is scoped to the dialog so it
     * does not collide with the topbar Save button.
     */
    async closeSavingChanges(): Promise<void> {
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
    /** The media field of a picture item, holding the preview and its hover actions. */
    get mediaField(): Locator {
        return this.page.getByTestId('authoring-field').and(this.page.locator('[data-test-value="media"]'));
    }

    /** "Original (W x H px)" under the preview, the only place the stored size is shown. */
    get originalSizeLabel(): Locator {
        return this.mediaField.getByTestId('original-size-label');
    }

    get previewImage(): Locator {
        return this.mediaField.getByTestId('media-image').locator('img');
    }

    crop(name: string): Locator {
        return this.mediaField.getByTestId('item-crop').and(this.page.locator(`[data-test-value="${name}"]`));
    }

    /** Reveals the Edit metadata / Edit image / Edit crops actions over the preview. */
    async hoverMedia(): Promise<void> {
        await this.mediaField.getByTestId('image-overlay').hover();
    }

    async openMetadataEditor(): Promise<void> {
        await this.hoverMedia();
        await this.mediaField.getByTestId('edit-metadata').click();
    }

    async openImageEditor(): Promise<void> {
        await this.hoverMedia();
        await this.mediaField.getByTestId('edit-image').click();
    }

    async openCropsEditor(): Promise<void> {
        await this.hoverMedia();
        await this.mediaField.getByTestId('crop').click();
    }
}
