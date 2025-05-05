import {Locator, Page, expect} from '@playwright/test';
import {s} from '../utils';

export class Authoring {
    protected page: Page;

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

    field(field: string): Locator {
        return this.page.locator(s('authoring', field)).getByRole('textbox');
    }

    async waitingForToastMsg(type: string, text: string): Promise<void> {
        const selector = `notification--${type}=${text}`;

        await expect(this.page.locator(s(selector))).toBeVisible();
        await expect(this.page.locator(s(selector))).toHaveText(`${text}`);
        await expect(this.page.locator(s(selector))).not.toBeVisible();
    }
}

export class PictureAuthoring extends Authoring {
    async openMetadataEditor(): Promise<void> {
        await this.page.locator(s('authoring-field=media', 'image-overlay')).hover();
        await this.page.locator(s('authoring-field=media', 'edit-metadata')).click();
    }
}
