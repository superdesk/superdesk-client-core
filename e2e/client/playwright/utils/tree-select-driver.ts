import {Locator, Page} from '@playwright/test';
import {s} from '.';

export class TreeSelectDriver {
    private page: Page;
    private element: Locator;

    constructor(page, element) {
        this.page = page;
        this.element = element;

        this.getValue = this.getValue.bind(this);
        this.addValue = this.addValue.bind(this);
        this.setValue = this.setValue.bind(this);
    }

    public async getValue(): Promise<Array<string>> {
        return this.element.locator(s('item')).all().then((buttons) =>
            Promise.all(buttons.map((button) => button.innerText())),
        );
    }

    public async addValue(...options: Array<Array<string> | string>): Promise<void> {
        const setOptions = async (options: Array<Array<string> | string>) => {
            for (const option of options) {
                if (typeof option == 'string') {
                    await this.element.locator(s('open-popover')).click();
                    await this.page.locator(s('tree-select-popover'))
                        .getByRole('button', {name: new RegExp(option, 'i')})
                        .click();
                } else if (option != null) {
                    await setOptions(option);
                }
            }
        };

        await setOptions(options);
    }

    public async setValue(...options: Array<Array<string> | string>) {
        const removeButton = await this.element.getByRole('button', {name: 'remove-sign'});
        const removeButtonVisible = await removeButton.isVisible();

        if (removeButtonVisible) {
            await removeButton.click();
        }

        await this.addValue(...options);
    }
}
