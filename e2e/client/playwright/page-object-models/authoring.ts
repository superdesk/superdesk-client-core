import {Locator, Page, Response, expect} from '@playwright/test';
import {s} from '../utils';
import {TreeSelectDriver} from '../utils/tree-select-driver';

/**
 * Class editor3 puts on a toolbar formatting button while the style is on at the caret.
 * Matched as a pattern because it is one of several classes on the element.
 */
export const ACTIVE_FORMATTING_BUTTON = /Editor3-activeButton/;

export interface IEditorThemeKeys {
    theme: string;
    font: string;
    headline: string;
    abstract: string;
    body: string;
}

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
        const panel = this.interactiveActionsPanel;

        await page.getByTestId('authoring').getByTestId('open-send-publish-pane').click();

        // the panel renders its buttons only once it has loaded the subscribers
        await expect(panel.getByTestId('publish')).toBeEnabled();

        if (options.subscribers.length > 0) {
            await new TreeSelectDriver(
                page,
                page.getByTestId('target-subscribers'),
            ).setValues(options.subscribers);
        }

        await panel.getByTestId('publish').click();

        // The "Save and send" confirm appears only when the item has unsaved changes
        // (targeting subscribers always counts); otherwise the publish goes straight
        // through and the panel closes. Wait for whichever happens, so the confirm is
        // never missed by a too-early visibility probe.
        const saveAndSend = page.getByTestId('modal-confirm').getByRole('button', {name: 'save and send'});

        if (options.subscribers.length > 0) {
            await saveAndSend.click();
        } else {
            const confirmAppeared = await Promise.race([
                saveAndSend.waitFor({state: 'visible'}).then(() => true),
                panel.waitFor({state: 'hidden'}).then(() => false),
            ]);

            if (confirmAppeared) {
                await saveAndSend.click();
            }
        }

        // Wait for the panel to finish closing, so a following interaction (e.g. a
        // second publish) is not intercepted by the closing overlay.
        await expect(panel).toBeHidden();
    }

    /**
     * Sets a leaf Subject term on the open article. Only leaf terms work: a parent
     * category opens a subtree instead of committing.
     */
    async setSubject(value: string): Promise<void> {
        const field = this.page.locator('#subjects');

        await field.getByTestId('meta-terms-toggle').click();
        await field.getByTestId('typeahead-input').fill(value);

        // The matched term renders as a button; getByRole ignores the hidden
        // duplicates the CV tree renders in collapsed branches.
        await field.getByRole('button', {name: value}).first().click();

        await expect(
            field.getByTestId('meta-terms-selected').getByText(value, {exact: false}),
        ).toBeVisible();
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

    // Resolves once `POST /api/macros` settles. Status is left unchecked: failing macros answer with an error status.
    async runMacro(macroLabel: string): Promise<Response> {
        const {page} = this;
        const macro = page.getByTestId('authoring-widget-panel')
            .getByTestId('macro-item')
            .filter({hasText: macroLabel});

        const [response] = await Promise.all([
            page.waitForResponse((res) =>
                res.url().includes('/api/macros') && res.request().method() === 'POST'),
            macro.click(),
        ]);

        return response;
    }

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

    saveButton(): Locator {
        return this.page.getByTestId('authoring-topbar').getByTestId('save');
    }

    /**
     * Runs an editing action and waits for the autosave it schedules to reach the
     * server before returning.
     *
     * Saving explicitly while an autosave request is still in flight leaves that
     * record on the server: `AuthoringService.save` calls `autosave.stop`, which only
     * cancels a timeout that has not fired yet, and then clears the client-side
     * `_autosave` reference. Reopening the article picks the record up again, and
     * `save_enabled()` (`$scope.dirty || item._autosave != null`) keeps the Save
     * button active on an article nothing has been changed in.
     */
    async withAutosave(action: () => Promise<unknown>): Promise<void> {
        await Promise.all([
            this.page.waitForResponse(
                (r) => r.url().includes('/api/archive_autosave')
                    && ['POST', 'PATCH'].includes(r.request().method()),
            ),
            action(),
        ]);
    }

    /**
     * Clicks the topbar Save and waits for the article PATCH to land, so a caller
     * that closes or reopens the item right after does not race the write.
     *
     * The response is matched on URL and method only; putting `ok()` in the
     * predicate would make a failed save time out instead of reporting its status.
     * `/api/archive/` also excludes the autosave writes, which go to
     * `/api/archive_autosave/`.
     */
    async saveFromTopbar(): Promise<void> {
        const {page} = this;

        const [response] = await Promise.all([
            page.waitForResponse(
                (r) => r.url().includes('/api/archive/') && r.request().method() === 'PATCH',
            ),
            this.saveButton().click(),
        ]);

        expect(response.status()).toBe(200);
        await expect(this.saveButton()).toBeDisabled();
    }

    async closeFromTopbar(): Promise<void> {
        await this.page.getByTestId('authoring-topbar').getByTestId('close').click();
        await expect(this.page.getByTestId('authoring-topbar')).toBeHidden();
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
     * Opens the media upload dialog from an empty media association field by
     * answering the native file chooser its drop zone opens. The file arrives in
     * the dialog already added, so the caller continues at the metadata step.
     */
    async startMediaFieldUpload(fieldId: string, filePath: string): Promise<void> {
        const [chooser] = await Promise.all([
            this.page.waitForEvent('filechooser'),
            this.associationField(fieldId).getByTestId('drop-zone-placeholder').click(),
        ]);

        await chooser.setFiles(filePath);
    }

    /**
     * Opens the media upload dialog from an editor3 field's Media toolbar button.
     * The dialog opens empty; the caller adds files through the dialog itself.
     * The toolbar button is an icon button named by its tooltip, not a
     * `formatting-option-button` like the text-style toggles.
     */
    async openBodyMediaUploadDialog(fieldId: string): Promise<void> {
        await this.fieldContainer(fieldId)
            .getByTestId('toolbar')
            .getByRole('button', {name: 'Media', exact: true})
            .click();
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

    secondaryToolbar(): Locator {
        return this.page.getByTestId('authoring-secondary-toolbar');
    }

    /**
     * The content area the editor theme applies to. authoring-react exposes the active theme's keys
     * on it as `data-editor-*` attributes; angular exposes them as `sd-editor--*` classes.
     */
    themeContainer(): Locator {
        return this.page.getByTestId('authoring-theme-container');
    }

    async expectEditorTheme(theme: Partial<IEditorThemeKeys>): Promise<void> {
        for (const [key, value] of Object.entries(theme)) {
            await expect(this.themeContainer()).toHaveAttribute(`data-editor-${key}`, value);
        }
    }

    /**
     * What the theme paints, read once: poll it after anything that changes the theme. Colours come
     * back as sRGB `r,g,b,a` so they compare whatever colour space the CSS declares them in.
     */
    readThemeAppearance(): Promise<{background: string; text: string; bodyFontSize: number}> {
        return this.fieldContainer('body_html').getByRole('textbox').evaluate((textbox) => {
            const container = textbox.closest('[data-test-id="authoring-theme-container"]');
            const context = document.createElement('canvas').getContext('2d');

            if (container == null || context == null) {
                throw new Error('the body field is not inside a themed container');
            }

            const toRgba = (color: string): string => {
                context.clearRect(0, 0, 1, 1);
                context.fillStyle = color;
                context.fillRect(0, 0, 1, 1);

                return context.getImageData(0, 0, 1, 1).data.join(',');
            };

            const style = window.getComputedStyle(textbox);

            return {
                background: toRgba(window.getComputedStyle(container).backgroundColor),
                text: toRgba(style.color),
                bodyFontSize: parseFloat(style.fontSize),
            };
        });
    }

    editorThemesPanel(slot: 'default' | 'proofreading'): Locator {
        return this.page.getByTestId('editor-themes-modal')
            .getByTestId('proofreading-panel')
            .and(this.page.locator(`[data-test-value="${slot}"]`));
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
