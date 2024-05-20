import {Page} from '@playwright/test';
import {s} from '.';

export const treeSelectDriver = (dataTestId: string) => {
    return {
        /**
         * Get all available options.
         */
        async getValues(page: Page): Promise<Array<string>> {
            await page.locator(s('open-popover')).click();

            return page.locator(s('tree-select-popover', 'options')).getByRole('button').all()
                .then((buttons) => Promise.all(buttons.map((button) => button.innerText())));
        },

        /**
         * Add an option/options to the already set options.
         */
        async addValue(page: Page, ...options: Array<Array<string> | string>): Promise<void> {
            const setOptions = async (options: Array<Array<string> | string>) => {
                for (const option of options) {
                    if (typeof option == 'string') {
                        await page.locator(s(dataTestId, 'open-popover')).click();
                        await page.locator(s('tree-select-popover'))
                            .getByRole('button', {name: new RegExp(option, 'i')})
                            .click();
                    } else if (option != null) {
                        setOptions(option);
                    }
                }
            };

            await setOptions(options);
        },

        /**
         * Reset already set options and set only the passed one/s.
         */
        async setValue(page: Page, ...options: Array<Array<string> | string>) {
            await page.locator(s(dataTestId)).getByRole('button', {name: 'remove-sign'}).click();

            this.addValue(options);
        },
    };
};
