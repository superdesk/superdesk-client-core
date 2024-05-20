import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';
import {treeSelectDriver} from './utils/tree-select-driver';

test('creation and persistance of a custom block', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/vocabularies');
    await page.locator(s('metadata-navigation')).getByRole('button', {name: 'Custom blocks'}).click();
    await page.getByRole('button', {name: 'Add New'}).click();

    // Input sample data
    await treeSelectDriver('formatting-options').addValue(page, 'h1');
    await page.locator(s('vocabulary-edit-content')).getByLabel('Id').fill('test_vocabulary');
    await page.locator(s('vocabulary-edit-content')).getByLabel('Name').fill('test_vocabulary');
    await page.locator(s('vocabulary-edit-content', 'editor3')).getByRole('textbox').fill('test data');

    // Apply formatting option to sample text data
    await page.locator(s('editor3')).getByText('test data').click();
    await page.locator(s('editor3', 'formatting-option=H1')).click();

    // Save editor block
    await page.locator(s('vocabulary-edit-footer')).getByRole('button', {name: 'Save'}).click();

    // Edit custom block
    await page.locator(s('vocabulary-item=test_vocabulary')).hover();
    await page.locator(s('vocabulary-item=test_vocabulary', 'vocabulary-item--start-editing')).click();

    // Check if formatting option, sample text data
    await expect(page.locator(s('editor3', 'formatting-option=H1'))).toBeVisible();
    await expect(page.locator(s('editor3')).getByRole('textbox')).toHaveText('test data');
});
