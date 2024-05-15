import {test} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';

test('creation and persistance of a custom block', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/vocabularies');
    await page.getByRole('button', {name: 'Custom blocks'}).click();
    await page.getByRole('button', {name: 'Add New'}).click();

    // Input sample data
    await page.locator(s('vocabulary-edit-content', 'vocabulary-edit--id')).fill('test_vocabulary');
    await page.locator(s('vocabulary-edit-content', 'vocabulary-edit-field--name')).fill('test_vocabulary');
    await page.locator(s('vocabulary-edit-content', 'editor3')).getByRole('textbox').fill('test data');

    // Add formatting options to template editor
    await page.locator(s('vocabulary-edit-content', 'open-popover')).click();
    await page.locator(s('tree-select-popover')).getByRole('button', {name: 'h2'}).click();
    await page.locator(s('editor3')).getByText('test data').click();

    // Apply formatting option to sample text data
    await page.locator(s('editor3', 'formatting-option=H2')).click();

    await page.locator(s('vocabulary-edit-footer')).getByRole('button', {name: 'Save'}).click();

    // Edit custom block
    await page.locator(s('vocabulary-item=test_vocabulary')).hover().then(async () => {
        await page.locator(s('vocabulary-item=test_vocabulary', 'vocabulary-item--start-editing')).click();

        // Remove formatting option
        await page.locator(s('editor3', 'formatting-option=H2')).click();
        await page.locator(s('vocabulary-edit-footer')).getByRole('button', {name: 'Save'}).click();
    });
});
