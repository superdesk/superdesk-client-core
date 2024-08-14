import {Monitoring} from './page-object-models/monitoring';
import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';
import {getEditor3FormattingOptions, getEditor3Paragraphs} from './utils/editor3';
import {TreeSelectDriver} from './utils/tree-select-driver';

test('can add embeds', async ({page}) => {
    await restoreDatabaseSnapshot();

    const monitoring = new Monitoring(page);

    const requestRoute = 'https://sourcefabric.org';

    await page.route(
        `https://iframe.ly/api/oembed?callback=?&url=
        ${requestRoute}
        &api_key="mock_api_key"
        &omit_script=true&iframe=true`,
        (route) => {
            route.fulfill({
                body: JSON.stringify([{
                    title: 'Open Source Software for Journalism',
                    description: 'Sourcefabric is Europe\'s largest developer of '
                    + 'open source tools for news media, powering news and media organisations around the world.',
                }]),
            });
        },
    );
    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    ).dblclick();

    page.locator(s('toolbar')).getByRole('button', {name: 'Embed'}).click();

    await page.locator(s('embed-form')).getByPlaceholder('Enter URL or code to embed')
        .fill('https://sourcefabric.org');

    await page.locator(s('embed-controls', 'submit')).click();
    await expect(
        page.locator(s('authoring', 'authoring-field=body_html')).getByText('https://sourcefabric.org'),
    ).toBeDefined();
});

test('accepting a spelling suggestion', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot({snapshotName: 'spellchecker'});

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

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
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot({snapshotName: 'spellchecker'});

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

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
 * FYI undo/redo isn't working the same as in the main editor outside tables
 * and it's not great that it's character based.
 */
test('tables maintaining cursor position at the start when executing "undo" action', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot({snapshotName: 'editor3-tables'});

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    ).dblclick();

    await page.locator(
        s('authoring', 'authoring-field=body_html', 'toolbar'),
    ).getByRole('button', {name: 'table'}).click();

    await page.locator(s('authoring', 'authoring-field=body_html', 'table-block'))
        .locator('[contenteditable]').first().pressSequentially('foo', {delay: 100});

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Control+z');

    await page.locator(s('authoring', 'authoring-field=body_html', 'table-block'))
        .locator('[contenteditable]').first().pressSequentially('bar', {delay: 100});

    await expect(
        page.locator(s('authoring', 'authoring-field=body_html', 'table-block')).locator('[contenteditable]').first(),
    ).toHaveText('barfo');
});

/**
 * FYI undo/redo isn't working the same as in the main editor outside tables
 * and it's not great that it's character based.
 */
test('tables maintaining cursor position in the middle when executing "undo" action', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot({snapshotName: 'editor3-tables'});

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    ).dblclick();

    await page.locator(
        s('authoring', 'authoring-field=body_html', 'toolbar'),
    ).getByRole('button', {name: 'table'}).click();

    await page.locator(s('authoring', 'authoring-field=body_html', 'table-block'))
        .locator('[contenteditable]').first().pressSequentially('foo', {delay: 100});

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Control+z');
    await page.keyboard.press('Control+z');

    await page.locator(s('authoring', 'authoring-field=body_html', 'table-block'))
        .locator('[contenteditable]').first().pressSequentially('bar', {delay: 100});

    await expect(
        page.locator(s('authoring', 'authoring-field=body_html', 'table-block')).locator('[contenteditable]').first(),
    ).toHaveText('fbar');
});

/**
 * FYI undo/redo isn't working the same as in the main editor outside tables
 * and it's not great that it's character based.
 */
test('tables maintaining cursor position at the end when executing "undo" action', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot({snapshotName: 'editor3-tables'});

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    ).dblclick();

    await page.locator(
        s('authoring', 'authoring-field=body_html', 'toolbar'),
    ).getByRole('button', {name: 'table'}).click();

    await page.locator(s('authoring', 'authoring-field=body_html', 'table-block'))
        .locator('[contenteditable]').first().pressSequentially('foo', {delay: 100});

    await page.keyboard.press('Control+z'); // undo last character

    await page.locator(s('authoring', 'authoring-field=body_html', 'table-block'))
        .locator('[contenteditable]').first().pressSequentially('bar', {delay: 100});

    await expect(
        page.locator(s('authoring', 'authoring-field=body_html', 'table-block')).locator('[contenteditable]').first(),
    ).toHaveText('fobar');
});

/**
 * FYI undo/redo isn't working the same as in the main editor outside tables
 * and it's not great that it's character based.
 */
test('tables maintaining cursor position when executing "redo" action', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot({snapshotName: 'editor3-tables'});

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    ).dblclick();

    await page.locator(
        s('authoring', 'authoring-field=body_html', 'toolbar'),
    ).getByRole('button', {name: 'table'}).click();

    await page.locator(s('authoring', 'authoring-field=body_html', 'table-block'))
        .locator('[contenteditable]').first().pressSequentially('foo', {delay: 100});

    await page.keyboard.press('Control+z');
    await page.keyboard.press('Control+y');

    await page.locator(s('authoring', 'authoring-field=body_html', 'table-block'))
        .locator('[contenteditable]').first().pressSequentially('bar', {delay: 100});

    await expect(
        page.locator(s('authoring', 'authoring-field=body_html', 'table-block')).locator('[contenteditable]').first(),
    ).toHaveText('fobaro');
});

test('configuring a vocabulary for custom blocks', async ({page}) => {
    await restoreDatabaseSnapshot();

    await page.goto('/#/settings/vocabularies');

    await page.locator(s('metadata-navigation')).getByRole('button', {name: 'Custom blocks'}).click();

    await page.getByRole('button', {name: 'Add New'}).click();

    // Input sample data
    await page.locator(s('vocabulary-edit-content')).getByLabel('Id').fill('custom_blocks_2');

    await page.locator(s('vocabulary-edit-content')).getByLabel('Name').fill('Custom blocks 2');

    await new TreeSelectDriver(
        page,
        page.locator(s('vocabulary-edit-content', 'formatting-options')),
    ).setValue(['h1']);

    await page.locator(s('vocabulary-edit-content', 'editor3')).getByRole('textbox').fill('test data');


    // Apply formatting option to sample text data
    await page.locator(s('editor3')).getByText('test data').click();
    await page.locator(s('editor3', 'formatting-option=h1')).click();

    // Save editor block
    await page.locator(s('vocabulary-edit-footer')).getByRole('button', {name: 'Save'}).click();

    await expect(page.locator(s('vocabulary-edit-content'))).not.toBeVisible(); // wait for saving to finish

    // Edit custom block
    await page.locator(s('vocabulary-item=Custom blocks 2')).hover();
    await page.locator(s('vocabulary-item=Custom blocks 2', 'vocabulary-item--start-editing')).click();

    // Check if formatting option, sample text data
    await expect(page.locator(s('editor3', 'formatting-option=h1'))).toBeVisible();
    await expect(page.locator(s('editor3')).getByRole('textbox')).toHaveText('test data');
});

test('adding a custom block inside editor3', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot({snapshotName: 'custom-blocks'});

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    ).dblclick();

    await page.locator(s('authoring', 'authoring-field=body_html')).getByRole('textbox').click();

    await page.locator(
        s('authoring', 'authoring-field=body_html', 'toolbar'),
    ).getByRole('button', {name: 'Custom block'}).click();

    await page.locator(s('tree-menu-popover'))
        .getByRole('button', {name: 'Custom Block 1'})
        .click();

    await expect(
        page.locator(s('authoring', 'authoring-field=body_html', 'custom-block')).getByRole('textbox').first(),
    ).toHaveText('custom block 1 template content');

    await page.locator(
        s('authoring', 'authoring-field=body_html', 'custom-block'),
    ).getByRole('textbox').click();

    const result = await getEditor3FormattingOptions(
        page.locator(s('authoring', 'authoring-field=body_html', 'editor3')),
    );

    expect(result).toEqual(['h2', 'italic', 'bold']);
});

