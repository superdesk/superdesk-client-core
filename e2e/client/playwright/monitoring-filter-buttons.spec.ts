import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';

// the active toggle is only a CSS class, there is no aria-pressed
const ACTIVE = /toggle-button--active/;

// [item type, aria-label], in render order
const ITEM_TYPES: Array<[string, string]> = [
    ['all', 'all'],
    ['text', 'text'],
    ['picture', 'picture'],
    ['graphic', 'graphic'],
    ['composite', 'package'],
    ['highlight-pack', 'highlights package'],
    ['video', 'video'],
    ['audio', 'audio'],
];

const TEXT_ITEMS = ['test sports story', 'story 2', 'Story 3', 'Story 5'];

// Items left by each filter across the Sports groups of the `media-items` snapshot. "Package
// Highlight 1" belongs to a highlight, so `composite` leaves only the plain "Shire package".
const LISTED: Record<string, Array<string>> = {
    'all': [
        ...TEXT_ITEMS,
        'Rivendell picture',
        'Moria graphic',
        'Shire package',
        'Package Highlight 1',
        'Isengard video',
        'Lothlorien audio',
    ],
    'text': TEXT_ITEMS,
    'picture': ['Rivendell picture'],
    'graphic': ['Moria graphic'],
    'composite': ['Shire package'],
    'highlight-pack': ['Package Highlight 1'],
    'video': ['Isengard video'],
    'audio': ['Lothlorien audio'],
};

// opening monitoring can cost a reload, and each filter change waits out a 1s query debounce
test.setTimeout(120000);

test.describe('monitoring item type filter buttons', {
    annotation: [
        {type: 'confluence', description: '1308524887 complete'}, // Filter buttons
    ],
}, () => {
    test('one button per item type is offered, in a fixed order', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        const monitoring = new Monitoring(page);

        await monitoring.openMonitoringForDesk('Sports');

        const buttons = monitoring.getFileTypeFilterButtons();

        await expect(buttons).toHaveCount(ITEM_TYPES.length);

        for (const [index, [itemType, label]] of ITEM_TYPES.entries()) {
            await expect(buttons.nth(index)).toHaveAttribute('data-test-id', `file-type-filter--${itemType}`);
            await expect(buttons.nth(index)).toHaveAttribute('aria-label', label);
        }
    });

    // The group keeps the old items in the DOM until the debounced query lands, so the names are
    // polled until the whole list matches rather than checked once.
    test('the list is filtered by item type, with ALL selected by default', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        const monitoring = new Monitoring(page);

        await monitoring.openMonitoringForDesk('Sports');

        const articles = monitoring.getListedArticles();
        const all = monitoring.getFileTypeFilterButton('all');
        const text = monitoring.getFileTypeFilterButton('text');

        const expectListed = (names: Array<string>) => expect
            .poll(async () => (await articles.evaluateAll(
                (nodes) => nodes.map((node) => node.getAttribute('data-test-value')),
            )).sort())
            .toEqual([...names].sort());

        await expect(all).toHaveClass(ACTIVE);
        await expectListed(LISTED.all);

        for (const [itemType] of ITEM_TYPES.filter(([type]) => type !== 'all')) {
            const button = monitoring.getFileTypeFilterButton(itemType);

            await button.click();

            await expect(button).toHaveClass(ACTIVE);
            await expect(all).not.toHaveClass(ACTIVE);
            await expectListed(LISTED[itemType]);

            // clicking an active type toggle clears it, which is the same state as ALL
            await button.click();

            await expect(all).toHaveClass(ACTIVE);
            await expect(button).not.toHaveClass(ACTIVE);
            await expectListed(LISTED.all);
        }

        await text.click();

        await expectListed(LISTED.text);

        await all.click();

        await expect(all).toHaveClass(ACTIVE);
        await expect(text).not.toHaveClass(ACTIVE);
        await expectListed(LISTED.all);
    });
});
