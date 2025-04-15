import {Locator, Page} from '@playwright/test';
import {s} from '../utils';
import {TreeSelectDriver} from '../utils/tree-select-driver';

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

    async publish(page, subscribers?: Array<string>): Promise<void> {
        await page.locator(s('authoring', 'open-send-publish-pane')).click();

        await new TreeSelectDriver(
            page,
            page.locator(s('target-subscribers')),
        ).setValue(subscribers);

        await page.locator(s('authoring', 'interactive-actions-panel', 'publish')).click();

        if (subscribers.length > 0) {
            await page.locator(s('modal-confirm')).getByRole('button', {name: 'save and send'}).click();
        }
    }

    async sendTo(page, stage?: 'Working Stage' | 'Incoming Stage', destination?: Array<string>): Promise<void> {
        await page.locator(s('authoring-topbar', 'open-send-publish-pane')).click();
        await page.locator(s('interactive-actions-panel', 'tabs')).getByRole('tab', {name: 'Send to'}).click();

        // selecting other desk
        await new TreeSelectDriver(
            page,
            page.locator(s('destination-select')),
        ).setValue(destination);

        // select stage
        await page
            .locator(s('interactive-actions-panel', 'stage-select'))
            .getByRole('radio', {name: stage})
            .check();

        await page.locator(s('interactive-actions-panel', 'send')).click();
    }

    field(field: string): Locator {
        return this.page.locator(s('authoring', field)).getByRole('textbox');
    }
}

export class PictureAuthoring extends Authoring {
    async openMetadataEditor(): Promise<void> {
        await this.page.locator(s('authoring-field=media', 'image-overlay')).hover();
        await this.page.locator(s('authoring-field=media', 'edit-metadata')).click();
    }
}
