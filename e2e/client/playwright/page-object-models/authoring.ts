import {Page} from '@playwright/test';
import {s} from '../utils';

export class Authoring {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async executeActionInEditor(...actionPath: Array<string>): Promise<void> {
        await this.page.locator(s('authoring-topbar', 'actions-button')).click();

        const actionsWithoutLast = actionPath.slice(0, actionPath.length - 1);

        for (const action of actionsWithoutLast) {
            await this.page.locator(s('actions-list')).getByRole('button', {name: action}).hover();
        }

        await this.page.locator(s('actions-list'))
            .getByRole('button', {name: actionPath[actionPath.length - 1]})
            .click();
    }


    async openMediaMetadataEditor() {
        await this.page.locator(s('image-overlay')).hover();
        await this.page.locator(s('edit-metadata')).click();
    }

    field(field: string) {
        return this.page.locator(s('authoring', 'field--' + field)).getByRole('textbox');
    }

    async waitForAutosave() {
        await this.page.waitForResponse(/\/api\/archive_autosave/);
    }
}
