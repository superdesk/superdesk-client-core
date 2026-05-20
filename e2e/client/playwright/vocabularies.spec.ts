import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';

test('can restore vocabulary data when editing is cancelled', async ({page}) => {
    const originalName = 'Categories';
    const updatedName = 'Categories test';
    const originalVocabularyItemSelector = s('metadata-content', `vocabulary-item=${originalName}`);

    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/vocabularies');

    const vocabularyItem = page.locator(originalVocabularyItemSelector);

    await expect(vocabularyItem).toBeVisible();
    await vocabularyItem.hover();
    await vocabularyItem.locator(s('vocabulary-item--start-editing')).click();

    await page.locator(s('vocabulary-edit-field--name')).fill(updatedName);
    await expect(page.locator(s('vocabulary-edit-field--name'))).toHaveValue(updatedName);

    await page.locator(s('vocabulary-edit-modal--cancel')).click();
    await expect(page.locator(originalVocabularyItemSelector).locator(s('vocabulary-item--name'))).toHaveText(originalName);
});
