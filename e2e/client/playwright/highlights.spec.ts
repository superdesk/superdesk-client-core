import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test.describe('highlights configuration', () => {
    test('shows a uniqueness error when creating a configuration with an existing name', async ({page}) => {
        await restoreDatabaseSnapshot();
        await page.goto('/#/settings/highlights');
        await expect(page.locator(s('highlights-list', 'highlights-item=Highlight 1'))).toBeVisible();

        await page.getByRole('button', {name: 'Create configuration'}).click();
        await page
            .locator(s('highlight-configuration-modal'))
            .getByLabel('Configuration name')
            .fill('Highlight 1');
        await page.locator(s('highlight-configuration-modal')).getByRole('button', {name: 'Save'}).click();

        await expect(page.locator(s('highlight-configuration-modal', 'error-uniqueness'))).toBeVisible();
    });

    test('shows a character-limit error and disables save when the name exceeds 40 chars', async ({page}) => {
        await restoreDatabaseSnapshot();
        await page.goto('/#/settings/highlights');
        await page.getByRole('button', {name: 'Create configuration'}).click();

        const modal = page.locator(s('highlight-configuration-modal'));
        const nameInput = modal.getByLabel('Configuration name');
        const saveButton = modal.getByRole('button', {name: 'Save'});
        const limitError = modal.locator(s('error-limits'));

        // pressSequentially dispatches input events per keystroke so the live
        // length validation fires, unlike fill() which sets the value in one go.
        await nameInput.pressSequentially('Highlights greater than Fourty characters');
        await expect(limitError).toBeVisible();
        await expect(saveButton).toBeDisabled();

        await nameInput.fill('');
        await nameInput.pressSequentially('Highlights less than Fourty characters');
        await expect(limitError).not.toBeVisible();
        await expect(saveButton).toBeEnabled();
    });

    test('renames a highlight configuration', async ({page}) => {
        await restoreDatabaseSnapshot();
        await page.goto('/#/settings/highlights');

        // The row's edit button is only visible on hover.
        await page.locator(s('highlights-item=Highlight 1')).hover();
        await page.locator(s('highlights-item=Highlight 1', 'edit')).click();
        await page
            .locator(s('highlight-configuration-modal'))
            .getByLabel('Configuration name')
            .fill('Highlight renamed');
        await page.locator(s('highlight-configuration-modal')).getByRole('button', {name: 'Save'}).click();

        await expect(page.locator(s('highlights-list', 'highlights-item=Highlight renamed'))).toBeVisible();
        await expect(page.locator(s('highlights-list', 'highlights-item=Highlight 1'))).not.toBeVisible();
    });

    test('deletes a highlight configuration', async ({page}) => {
        await restoreDatabaseSnapshot();
        await page.goto('/#/settings/highlights');
        await expect(page.locator(s('highlights-list', 'highlights-item=Highlight 1'))).toBeVisible();

        // The row's remove button is only visible on hover.
        await page.locator(s('highlights-item=Highlight 1')).hover();
        await page.locator(s('highlights-item=Highlight 1', 'remove')).click();
        await page.locator(s('modal-confirm')).getByRole('button', {name: /ok/i}).click();

        await expect(page.locator(s('highlights-list', 'highlights-item=Highlight 1'))).not.toBeVisible();
    });
});

test.describe('mark for highlights', () => {
    test('removes a highlight from an article via the indicator popup', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        const article = page.locator(s('article-item=test sports story'));

        await monitoring.executeActionOnMonitoringItem(article, 'Mark for highlight', 'Highlight 1');
        await expect(article.locator(s('highlights-indicator'))).toBeVisible();

        await article.locator(s('highlights-indicator')).click();
        await expect(page.locator(s('highlights-list'))).toBeVisible();
        await page.locator(s('highlights-list')).getByRole('button', {name: 'REMOVE'}).first().click();

        await expect(article.locator(s('highlights-indicator'))).not.toBeVisible();
    });
});
