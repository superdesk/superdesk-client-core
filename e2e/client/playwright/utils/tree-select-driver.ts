import {Locator, Page} from '@playwright/test';
import {s} from '.';

// Supports multiple nested values. e.g.:
// ['a', ['b', 'b.1', 'b.2']]
// 'a' and 'b2' would be selected. The array is for specifying the path to 'b.2'
type IOptions = Array<string | Array<string>>;

export class TreeSelectDriver {
    private page: Page;
    private element: Locator;

    constructor(page: Page, element: Locator) {
        this.page = page;
        this.element = element;

        this.getValues = this.getValues.bind(this);
        this.addValues = this.addValues.bind(this);
        this.setValues = this.setValues.bind(this);
    }

    public async getValues(): Promise<Array<string>> {
        return this.element.locator(s('item')).all().then((buttons) =>
            Promise.all(buttons.map((button) => button.innerText())),
        );
    }

    private async addValue(...options: Array<string>) {
        await this.element.locator(s('open-popover')).click();

        for (const option of options) {
            await this.page.locator(
                s('tree-select-popover', 'options'),
            ).getByRole('treeitem', {name: option, exact: true}).click();

            // if option is last in the list, but has children - select entire category
            if (option === options[options.length - 1]) {
                const entireCategoryButton = this.page.locator(s('tree-select-popover'))
                    .getByRole('button', {name: 'Choose entire category'});

                const visible = await entireCategoryButton.isVisible();

                if (visible) {
                    await entireCategoryButton.click();
                }
            }
        }
    }

    public async addValues(...options: IOptions): Promise<void> {
        for (const option of options) {
            await this.addValue(...(Array.isArray(option) ? option : [option]));
        }
    }

    public async setValues(...options: IOptions) {
        const removeButton = this.element.getByRole('button', {name: 'remove-sign'});
        const removeButtonVisible = await removeButton.isVisible();

        if (removeButtonVisible) {
            await removeButton.click();
        }

        await this.addValues(...options);
    }
}
