import {Locator, Page, Response, expect} from '@playwright/test';
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

    /** The angular editor's topbar or authoring-react's toolbars, which carry the same `save` and `close` ids. */
    protected get topbar(): Locator {
        return this.page.getByTestId('authoring-topbar')
            .or(this.page.getByTestId('authoring').getByTestId('authoring-toolbar-1'));
    }

    // the open item's send / publish panel: angular renders it inside the editor, authoring-react outside
    get interactiveActionsPanel(): Locator {
        return this.page.getByTestId('authoring').getByTestId('interactive-actions-panel')
            .or(this.page.getByTestId('authoring-actions-panel-overlay').getByTestId('interactive-actions-panel'));
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
        const publish = this.interactiveActionsPanel.getByTestId('panel-footer').getByTestId('publish');

        await page.getByTestId('authoring').getByTestId('open-send-publish-pane').click();

        // the panel renders its buttons only once it has loaded the subscribers
        await expect(publish).toBeEnabled();

        if (options.subscribers.length > 0) {
            await new TreeSelectDriver(
                page,
                page.getByTestId('target-subscribers'),
            ).setValues(options.subscribers);
        }

        await publish.click();

        if (options.subscribers.length > 0) {
            await page.getByTestId('modal-confirm').getByRole('button', {name: 'save and send'}).click();
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
     *
     * The tab toggles rather than opens: clicking it while its widget is active
     * closes the panel. The tab is therefore only clicked when the panel is not
     * already showing, so that calling this on an open widget is a no-op.
     */
    async openWidget(label: string): Promise<Locator> {
        const {page} = this;
        const withLabel = page.locator(`[data-test-value="${label}"]`);
        const panel = page.getByTestId('authoring-widget-panel').and(withLabel);

        if (!await panel.isVisible()) {
            await page.getByTestId('authoring-widget').and(withLabel).click();
        }

        await expect(panel).toBeVisible();

        return panel;
    }

    /**
     * Closes an open side widget. The panel is an overlay above the article body, so
     * anything that has to reach a body field needs it closed first.
     */
    async closeWidget(label: string): Promise<void> {
        const {page} = this;
        const withLabel = page.locator(`[data-test-value="${label}"]`);
        const panel = page.getByTestId('authoring-widget-panel').and(withLabel);

        if (await panel.isVisible()) {
            await page.getByTestId('authoring-widget').and(withLabel).click();
        }

        await expect(panel).toBeHidden();
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
     * Fields that autosave on a debounce can land a record after the item was saved, and
     * the item then counts as unsaved on close even when nothing was touched since, so
     * the "Save changes?" prompt is genuinely optional and is discarded only if it shows.
     */
    async close(): Promise<void> {
        const {page} = this;
        const unsavedChanges = page.getByTestId('unsaved-changes-dialog');

        await this.topbar.getByTestId('close').click();

        await expect(async () => {
            if (await unsavedChanges.isVisible()) {
                await unsavedChanges.getByRole('button', {name: 'Ignore', exact: true}).click();
            }

            await expect(page.getByTestId('authoring')).toBeHidden({timeout: 1000});
        }).toPass({timeout: 20000});
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

    // saves in either editor and returns the PATCH request and response
    async saveAndGetRequest(): Promise<{request: any; response: any}> {
        const save = this.topbar.getByTestId('save');
        const saved = this.page.waitForResponse(
            (r: Response) => r.request().method() === 'PATCH' && r.url().includes('/api/archive/'),
        );

        await expect(save).toBeEnabled();
        await save.click();

        const response = await saved;

        expect(response.ok()).toBe(true);
        await expect(save).toBeDisabled();

        return {request: response.request().postDataJSON(), response: await response.json()};
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

export class PackageAuthoring extends Authoring {
    group(groupId: string): Locator {
        return this.fieldContainer('groups')
            .getByTestId('package-group')
            .and(this.page.locator(`[data-test-value="${groupId}"]`));
    }

    groupItems(groupId: string): Locator {
        return this.group(groupId).getByTestId('package-items');
    }

    item(slugline: string): Locator {
        return this.fieldContainer('groups')
            .getByTestId('package-items')
            .and(this.page.locator(`[data-test-value="${slugline}"]`));
    }

    private row(slugline: string): Locator {
        return this.fieldContainer('groups')
            .getByTestId('package-item-row')
            .filter({
                has: this.page.getByTestId('package-items').and(this.page.locator(`[data-test-value="${slugline}"]`)),
            });
    }

    /**
     * Drops an item in front of another one, in any group. The list library lifts the item and
     * makes room for it a frame late, so each step waits, or the drop lands where it started.
     */
    async dragItemBefore(slugline: string, targetSlugline: string): Promise<void> {
        const {page} = this;
        const dragged = this.row(slugline);
        const target = this.row(targetSlugline);
        const handle = dragged.getByTestId('package-item-drag-handle');

        // the cards grow once the items they show have loaded, so their positions settle only then
        await expect(dragged.getByTestId('package-item-state')).toBeVisible();
        await expect(target.getByTestId('package-item-state')).toBeVisible();

        // opening the editor puts the focus in its first field, which scrolls the editor back to the top
        await expect(page.getByTestId('authoring').locator(':focus')).toHaveCount(1);

        // the package header can push the items below the fold, and both ends of the drag have to be on screen
        await target.scrollIntoViewIfNeeded();
        await handle.scrollIntoViewIfNeeded();
        await expect(target).toBeInViewport();

        // waits for the handle to stop moving, the editor slides in when it opens
        await handle.hover();

        const from = await getBox(handle, `drag handle of "${slugline}"`);

        await page.mouse.down();
        await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2 - 10, {steps: 5});
        await expect(dragged).toHaveCSS('position', 'fixed');

        const to = await getBox(target, `"${targetSlugline}"`);

        await page.mouse.move(to.x + to.width / 2, to.y + to.height / 4, {steps: 20});
        await expect(target).not.toHaveCSS('transform', 'none');

        await page.mouse.up();
    }
}

async function getBox(locator: Locator, name: string): Promise<{x: number; y: number; width: number; height: number}> {
    const box = await locator.boundingBox();

    if (box == null) {
        throw new Error(`${name} is not visible`);
    }

    return box;
}
