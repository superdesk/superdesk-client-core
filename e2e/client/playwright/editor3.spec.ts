import {test, expect} from '@playwright/test';
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