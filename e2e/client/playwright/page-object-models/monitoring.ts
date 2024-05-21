import {Page, Locator} from '@playwright/test';
import {nameof} from 'core/helpers/typescript-helpers';
import {s} from '../utils';

export class Monitoring {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async selectDeskOrWorkspace(deskName: string): Promise<void> {
        const deskSelectDropdown = this.page.locator(s('monitoring--selected-desk'));

        const selectedDeskText = await deskSelectDropdown.textContent();

        if (selectedDeskText.toLocaleLowerCase().includes(deskName.toLocaleLowerCase()) !== true) {
            await deskSelectDropdown.click();
            await this.page.locator(`${s('monitoring--select-desk-options')} button`, {hasText: deskName}).click();
        }
    }

    /**
     * opens 3-dot menu for an article and clicks on an action(supports nested actions)
     */
    async executeActionOnMonitoringItem(item: Locator, ...actionPath: Array<string>): Promise<void> {
        await item.hover();
        await item.locator(s('context-menu-button')).click();

        const actionsWithoutLast = actionPath.slice(0, actionPath.length - 1);

        for (const action of actionsWithoutLast) {
            await this.page.locator(s('context-menu')).getByRole('button', {name: action, exact: true}).hover();
        }

        await this.page.locator(s('context-menu'))
            .getByRole('button', {name: actionPath[actionPath.length - 1], exact: true})
            .click();
    }

    async createArticleFromTemplate(template: string, options?: {slugline?:string, body_html?: string}): Promise<void> {
        await this.page.locator(s('content-create')).click();
        await this.page.locator(s('content-create-dropdown')).getByRole('button', {name: 'More Templates...'}).click();
        await this.page.locator(s('content-create-dropdown')).getByRole('button', {name: template}).click();

        if (options != null) {
            let keys = Object.keys(options);

            for (const key of keys) {
                if (key === nameof<typeof options>('slugline')) {
                    await this.page.locator(s('authoring', `field-${key}`)).fill(options[key]);
                } else {
                    await this.page.locator(
                        s('authoring', `authoring-field=${key}`),
                    ).getByRole('textbox').fill(options[key]);
                }
            }
        }
    }
}
