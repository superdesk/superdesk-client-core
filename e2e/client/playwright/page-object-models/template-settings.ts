import {Locator, Page, expect} from '@playwright/test';

// superdesk-core lowercases `template_name` on create but not on rename, so a card's
// `data-test-value` is only predictable for lowercase names. Use lowercase names.
export class TemplateSettings {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    getCard(templateName: string): Locator {
        return this.page.getByTestId('content-template')
            .and(this.page.locator(`[data-test-value="${templateName}"]`));
    }

    // `card-box__header--dark` (grey heading) is set while `is_public` is false, see templates.html.
    // Specs assert the class, not the resolved colour.
    getCardHeader(templateName: string): Locator {
        return this.getCard(templateName).getByTestId('template-card-header');
    }

    getCardDesks(templateName: string): Locator {
        return this.getCard(templateName).locator('li', {has: this.page.getByRole('heading', {name: 'Desk(s)'})})
            .locator('span');
    }

    getEditor(): Locator {
        return this.page.getByTestId('template-edit-view');
    }

    // Rendered only with `content_templates`. State is the `checked` class; the attribute is
    // removed, not set to false.
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

    // The card list re-renders on `template:update`, which can replace the card after its
    // menu opens, so retry the whole open-menu-then-Edit sequence.
    async openEditor(templateName: string): Promise<void> {
        const card = this.getCard(templateName);
        const menu = card.getByTestId('template-actions--options');

        await expect(card).toBeVisible();

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

    // Until `content_types` loads, the editor shows a text `<input>` with the same
    // `id="template-profile"` as the `<select>`, so match the tag to wait for the right one.
    async setProfile(profileLabel: string): Promise<void> {
        const profile = this.getEditor().locator('select#template-profile');

        await expect(profile).toBeVisible();
        await profile.selectOption({label: profileLabel});
    }

    async toggleMakePublic(): Promise<void> {
        await this.getMakePublicSwitch().click();
    }

    // Waits for the response: the editor closes before `fetchTemplates()` finishes, so
    // "editor gone" alone could still be followed by a read of the pre-save list.
    // A new template is a POST, an edit a PATCH.
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

    async makePersonal(templateName: string): Promise<void> {
        await this.openEditor(templateName);
        await this.toggleMakePublic();
        await this.save('PATCH');
    }
}
