import {Locator, Page, expect} from '@playwright/test';

/**
 * Settings > Templates (`/#/settings/templates`).
 *
 * `ContentTemplatesService.on_create_async` in superdesk-core lowercases
 * `template_name` on create but `on_update_async` leaves a renamed one as typed, so a
 * card's `data-test-value` is only predictable when the name was typed in lowercase to
 * begin with. Pass lowercase names here and type lowercase names into the editor.
 */
export class TemplateSettings {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    getCard(templateName: string): Locator {
        return this.page.getByTestId('content-template')
            .and(this.page.locator(`[data-test-value="${templateName}"]`));
    }

    /**
     * The card header carries `card-box__header--dark` while `is_public` is false
     * (`ng-class` in scripts/apps/templates/views/templates.html). That modifier is
     * what paints the heading grey (`background-color: hsl(215, 8%, 49%)` in
     * scripts/apps/templates/styles/templates.scss); a public template keeps the
     * ui-framework default. Specs assert the class, not the resolved colour.
     */
    getCardHeader(templateName: string): Locator {
        return this.getCard(templateName).getByTestId('template-card-header');
    }

    getEditor(): Locator {
        return this.page.getByTestId('template-edit-view');
    }

    /**
     * The `Make Public` toggle. Only rendered for users holding `content_templates`
     * (`ng-if="privileges.content_templates"` in template-editor-modal.html), so the
     * locator resolving to nothing is itself the assertion for a user without it.
     *
     * `sd-switch` reflects its model as a `checked` class on the rendered
     * `<span class="sd-toggle">` (superdesk-ui-framework/app/scripts/switch.js). It
     * also sets a `checked` attribute, but that goes through jQuery's boolean-attribute
     * handling, which removes the attribute rather than writing "false", so the class
     * is the only handle that reads both states.
     */
    getMakePublicSwitch(): Locator {
        return this.getEditor().getByTestId('make-public');
    }

    async expectMakePublic(on: boolean): Promise<void> {
        const toggle = this.getMakePublicSwitch();

        await expect(toggle).toBeVisible();

        if (on) {
            await expect(toggle).toHaveClass(/checked/);
        } else {
            await expect(toggle).not.toHaveClass(/checked/);
        }
    }

    /**
     * Opens a template card's 3-dot menu and clicks Edit.
     *
     * The whole card list is one `ng-repeat` over `content_templates._items`, and
     * `fetchTemplates()` in TemplatesDirective reassigns that collection on every
     * `$scope.cancel()` and on every `template:update` websocket event, so the card
     * carrying the open menu can be replaced between the toggle click and the click on
     * Edit. The replacement renders with the menu closed and nothing reopens it, which
     * is a hang rather than a slow pass. Retrying the toggle is what survives it.
     */
    async openEditor(templateName: string): Promise<void> {
        const card = this.getCard(templateName);
        const menu = card.getByTestId('template-actions--options');

        await expect(card).toBeVisible();

        // Two full attempts, and a budget that still fits inside Playwright's 30s
        // default test timeout so this stays usable from a spec that does not raise it.
        await expect(async () => {
            await card.getByTestId('template-actions').click({timeout: 4000});
            await menu.getByRole('button', {name: 'Edit'}).click({timeout: 4000});
            await expect(this.getEditor()).toBeVisible({timeout: 4000});
        }).toPass({timeout: 25000});
    }

    async startNewTemplate(): Promise<void> {
        await this.page.getByTestId('template-header').getByRole('button', {name: 'Add new'}).click();
        await expect(this.getEditor()).toBeVisible();
    }

    async setName(templateName: string): Promise<void> {
        await this.getEditor().getByPlaceholder('template name').fill(templateName);
    }

    /**
     * The editor renders "Content Profile" as a free-text `<input>` while `content_types`
     * is still empty and swaps in the `<select>` once the fetch resolves (the two
     * `ng-if`s on `content_types.length` in template-editor-modal.html). Both carry
     * `id="template-profile"`, so a label lookup can resolve to the input and fail with
     * "Element is not a <select> element"; matching the tag waits for the right one.
     */
    async setProfile(profileLabel: string): Promise<void> {
        const profile = this.getEditor().locator('select#template-profile');

        await expect(profile).toBeVisible();
        await profile.selectOption({label: profileLabel});
    }

    async toggleMakePublic(): Promise<void> {
        await this.getMakePublicSwitch().click();
    }

    /**
     * Saves the open editor and waits for the write to land before returning.
     *
     * The success handler of `templates.save()` calls `$scope.cancel()`, which closes
     * the editor and only *starts* `fetchTemplates()`, so a caller that navigated or
     * reloaded on "the editor is gone" alone could still read the pre-save list.
     * Awaiting the response makes every caller safe.
     *
     * `method` picks between the two writes the same button issues: a new template is a
     * POST to the collection, an edit a PATCH to the item.
     */
    async save(method: 'POST' | 'PATCH'): Promise<void> {
        const expectedStatus = method === 'POST' ? 201 : 200;

        const [response] = await Promise.all([
            this.page.waitForResponse((r) => {
                const {pathname} = new URL(r.url());

                return r.request().method() === method
                    && (method === 'POST'
                        ? pathname.endsWith('/content_templates')
                        : pathname.includes('/content_templates/'));
            }),
            this.getEditor().getByTestId('save').click(),
        ]);

        expect(response.status()).toBe(expectedStatus);

        await expect(this.getEditor()).toBeHidden();
    }

    async cancel(): Promise<void> {
        await this.getEditor().getByRole('button', {name: 'Cancel'}).click();
        await expect(this.getEditor()).toBeHidden();
    }

    /** Turns an existing public template into a personal one owned by the current user. */
    async makePersonal(templateName: string): Promise<void> {
        await this.openEditor(templateName);
        await this.toggleMakePublic();
        await this.save('PATCH');
    }
}
