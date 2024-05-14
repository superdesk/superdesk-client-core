import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';
import {getEditor3Paragraphs} from './utils/editor3';

test('accepting a spelling suggestion', async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: 'spellchecker'});

    await page.goto('/#/workspace/monitoring');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=spellchecker test'),
    ).dblclick();

    await expect(page.locator(s('authoring', 'authoring-field=body_html', 'spellchecker-warning'))).toHaveCount(2);

    expect(await getEditor3Paragraphs(page.locator(s('authoring', 'authoring-field=body_html'))))
        .toStrictEqual(['ghello world', 'ghello world']);

    await page.locator(s('authoring', 'authoring-field=body_html', 'spellchecker-warning'))
        .first()
        .click({button: 'right'});

    await page.locator(s('spellchecker-menu')).getByRole('button', {name: 'hello'}).click();

    await expect(
        (await page.locator(s('authoring', 'authoring-field=body_html', 'spellchecker-warning')).all()).length,
    ).toBe(1);

    expect(await getEditor3Paragraphs(page.locator(s('authoring', 'authoring-field=body_html'))))
        .toStrictEqual(['hello world', 'ghello world']);
});

test('adding word marked as a spellchecker issue to dictionary', async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: 'spellchecker'});

    await page.goto('/#/workspace/monitoring');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=spellchecker test'),
    ).dblclick();

    await expect(page.locator(s('authoring', 'authoring-field=body_html', 'spellchecker-warning'))).toHaveCount(2);

    expect(await getEditor3Paragraphs(page.locator(s('authoring', 'authoring-field=body_html'))))
        .toStrictEqual(['ghello world', 'ghello world']);

    await page.locator(s('authoring', 'authoring-field=body_html', 'spellchecker-warning'))
        .first()
        .click({button: 'right'});

    await page.locator(s('spellchecker-menu')).getByRole('button', {name: 'Add to dictionary'}).click();

    /**
     * it expects zero, because when a word is added to dictionary
     * it should remove warnings for all instances of that word
     * including nested editors (e.g. multi-line-quote)
     */
    await expect(
        page.locator(s('authoring', 'authoring-field=body_html', 'spellchecker-warning')),
    ).toHaveCount(0);

    expect(await getEditor3Paragraphs(page.locator(s('authoring', 'authoring-field=body_html'))))
        .toStrictEqual(['ghello world', 'ghello world']);
});

/**
 * FYI undo/redo isn't working the same as in the main editor outside tables and it's not great that it's character based.
 */
test('tables maintaining cursor position at the start when executing "undo" action', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot({snapshotName: 'editor3-tables'});

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    ).dblclick();

    await page.locator(s('authoring', 'authoring-field=body_html', 'toolbar')).getByRole('button', {name: 'table'}).click();

    await page.locator(s('authoring', 'authoring-field=body_html', 'table-block'))
        .locator('[contenteditable]').first().pressSequentially('foo');

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Control+z');

    await page.locator(s('authoring', 'authoring-field=body_html', 'table-block'))
        .locator('[contenteditable]').first().pressSequentially('bar');

    await expect(
        page.locator(s('authoring', 'authoring-field=body_html', 'table-block')).locator('[contenteditable]').first(),
    ).toHaveText('barfo');
});

/**
 * FYI undo/redo isn't working the same as in the main editor outside tables and it's not great that it's character based.
 */
test('tables maintaining cursor position in the middle when executing "undo" action', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot({snapshotName: 'editor3-tables'});

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    ).dblclick();

    await page.locator(s('authoring', 'authoring-field=body_html', 'toolbar')).getByRole('button', {name: 'table'}).click();

    await page.locator(s('authoring', 'authoring-field=body_html', 'table-block'))
        .locator('[contenteditable]').first().pressSequentially('foo');

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Control+z');
    await page.keyboard.press('Control+z');

    await page.locator(s('authoring', 'authoring-field=body_html', 'table-block'))
        .locator('[contenteditable]').first().pressSequentially('bar');

    await expect(
        page.locator(s('authoring', 'authoring-field=body_html', 'table-block')).locator('[contenteditable]').first(),
    ).toHaveText('fbar');
});

/**
 * FYI undo/redo isn't working the same as in the main editor outside tables and it's not great that it's character based.
 */
test('tables maintaining cursor position at the end when executing "undo" action', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot({snapshotName: 'editor3-tables'});

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    ).dblclick();

    await page.locator(s('authoring', 'authoring-field=body_html', 'toolbar')).getByRole('button', {name: 'table'}).click();

    await page.locator(s('authoring', 'authoring-field=body_html', 'table-block'))
        .locator('[contenteditable]').first().pressSequentially('foo');

    await page.keyboard.press('Control+z'); // undo last character

    await page.locator(s('authoring', 'authoring-field=body_html', 'table-block'))
        .locator('[contenteditable]').first().pressSequentially('bar');

    await expect(
        page.locator(s('authoring', 'authoring-field=body_html', 'table-block')).locator('[contenteditable]').first(),
    ).toHaveText('fobar');
});

/**
 * FYI undo/redo isn't working the same as in the main editor outside tables and it's not great that it's character based.
 */
test('tables maintaining cursor position when executing "redo" action', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot({snapshotName: 'editor3-tables'});

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    ).dblclick();

    await page.locator(s('authoring', 'authoring-field=body_html', 'toolbar')).getByRole('button', {name: 'table'}).click();

    await page.locator(s('authoring', 'authoring-field=body_html', 'table-block'))
        .locator('[contenteditable]').first().pressSequentially('foo');

    await page.keyboard.press('Control+z');
    await page.keyboard.press('Control+y');

    await page.locator(s('authoring', 'authoring-field=body_html', 'table-block'))
        .locator('[contenteditable]').first().pressSequentially('bar');

    await expect(
        page.locator(s('authoring', 'authoring-field=body_html', 'table-block')).locator('[contenteditable]').first(),
    ).toHaveText('fobaro');
});
