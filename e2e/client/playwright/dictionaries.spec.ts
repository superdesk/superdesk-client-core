import {test, expect, Page} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';

async function openAddDictionaryMenu(page: Page): Promise<void> {
    await page.locator(s('add-dictionary-toggle')).click();
    // The dropdown__toggle directive toggles a class on the parent; wait for
    // the menu's personal-dictionary item to be visible before any caller
    // tries to click one (it's the only item present for all users).
    await expect(page.locator(s('create-personal-dictionary'))).toBeVisible();
}

test('create, edit, add and remove a word in, and delete a dictionary', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/dictionaries');

    // create dictionary "Test Dict"
    await openAddDictionaryMenu(page);
    await page.locator(s('create-dictionary')).click();

    await page.locator(s('dict-name')).fill('Test Dict');
    await page.locator(s('dict-lang-code')).fill('en');
    await page.locator(s('save')).click();

    await expect(page.locator(s('dictionary-row=Test Dict'))).toBeVisible();

    // Edit dictionary name to "Test Dict 2". The action buttons only become
    // visible on hover, so hover the row first.
    await page.locator(s('dictionary-row=Test Dict')).hover();
    await page.locator(s('dictionary-row=Test Dict', 'dictionary-edit')).click();

    await page.locator(s('dict-name')).fill('Test Dict 2');
    await page.locator(s('save')).click();

    await expect(page.locator(s('dictionary-row=Test Dict 2'))).toBeVisible();
    await expect(page.locator(s('dictionary-row=Test Dict'))).not.toBeVisible();

    // Open it again, add a word, then remove it.
    await page.locator(s('dictionary-row=Test Dict 2')).hover();
    await page.locator(s('dictionary-row=Test Dict 2', 'dictionary-edit')).click();

    await page.locator(s('words-search')).fill('theta');
    await expect(page.locator(s('dictionary-word'))).toHaveCount(0);
    await page.locator(s('add-word')).click();
    await expect(page.locator(s('dictionary-word=theta'))).toBeVisible();
    await page.locator(s('dictionary-word=theta', 'dictionary-word-remove')).click();
    await expect(page.locator(s('dictionary-word'))).toHaveCount(0);
    await page.locator(s('save')).click();

    // Delete the dictionary entirely.
    await page.locator(s('dictionary-row=Test Dict 2')).hover();
    await page.locator(s('dictionary-row=Test Dict 2', 'dictionary-remove')).click();
    await page.locator(s('modal-confirm')).getByRole('button', {name: /ok/i}).click();
    await expect(page.locator(s('dictionary-row=Test Dict 2'))).not.toBeVisible();
});

test('create a personal dictionary', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/dictionaries');

    await openAddDictionaryMenu(page);
    await page.locator(s('create-personal-dictionary')).click();

    await page.locator(s('dict-lang-code')).fill('fr');
    await page.locator(s('save')).click();

    // Personal dictionaries are listed by language code instead of name; the
    // row interpolates the language_id into a "(fr)" label, which is the
    // user-visible signal that the row exists.
    await expect(page.locator(s('dictionary-row')).filter({hasText: '(fr)'})).toBeVisible();
});
