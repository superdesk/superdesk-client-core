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

// Items left by each filter for the Sports groups in the `main` snapshot. "Package Highlight 1"
// is a highlight package, which `composite` excludes. The snapshot has no picture, graphic,
// video or audio item, so those filters can only be shown to empty the list.
const LISTED: Record<string, number> = {
    'all': 5,
    'text': 4,
    'picture': 0,
    'graphic': 0,
    'composite': 0,
    'highlight-pack': 1,
    'video': 0,
    'audio': 0,
};

// opening monitoring can cost a reload, and each filter change waits out a 1s query debounce
test.setTimeout(120000);

test.describe('monitoring item type filter buttons', {
    annotation: [
        // partial: the snapshot has no picture/graphic/video/audio item, so those filters are
        // only shown to exclude everything else, not to select items of their own type
        {type: 'confluence', description: '1308524887 partial'}, // Filter buttons
    ],
}, () => {
    test('one button per item type is offered, in a fixed order', async ({page}) => {
        await restoreDatabaseSnapshot();

        const monitoring = new Monitoring(page);

        await monitoring.openMonitoringForDesk('Sports');

        const buttons = monitoring.getFileTypeFilterButtons();

        await expect(buttons).toHaveCount(ITEM_TYPES.length);

        for (const [index, [itemType, label]] of ITEM_TYPES.entries()) {
            await expect(buttons.nth(index)).toHaveAttribute('data-test-id', `file-type-filter--${itemType}`);
            await expect(buttons.nth(index)).toHaveAttribute('aria-label', label);
        }
    });

    // The group keeps the old items in the DOM until the debounced query lands, so a visibility
    // check alone would pass against the stale list. Wait on the count first.
    test('the list is filtered by item type, with ALL selected by default', async ({page}) => {
        await restoreDatabaseSnapshot();

        const monitoring = new Monitoring(page);

        await monitoring.openMonitoringForDesk('Sports');

        const articles = monitoring.getListedArticles();
        const all = monitoring.getFileTypeFilterButton('all');
        const text = monitoring.getFileTypeFilterButton('text');

        const textArticle = monitoring.getListedArticle('story 2');
        const packageArticle = monitoring.getListedArticle('Package Highlight 1');

        await expect(all).toHaveClass(ACTIVE);
        await expect(articles).toHaveCount(LISTED.all);
        await expect(textArticle).toBeVisible();
        await expect(packageArticle).toBeVisible();

        for (const [itemType] of ITEM_TYPES.filter(([type]) => type !== 'all')) {
            const button = monitoring.getFileTypeFilterButton(itemType);

            await button.click();

            await expect(button).toHaveClass(ACTIVE);
            await expect(all).not.toHaveClass(ACTIVE);
            await expect(articles).toHaveCount(LISTED[itemType]);
            await expect(textArticle).toBeVisible({visible: itemType === 'text'});
            await expect(packageArticle).toBeVisible({visible: itemType === 'highlight-pack'});

            // clicking an active type toggle clears it, which is the same state as ALL
            await button.click();

            await expect(all).toHaveClass(ACTIVE);
            await expect(button).not.toHaveClass(ACTIVE);
            await expect(articles).toHaveCount(LISTED.all);
        }

        await text.click();

        await expect(articles).toHaveCount(LISTED.text);

        await all.click();

        await expect(all).toHaveClass(ACTIVE);
        await expect(text).not.toHaveClass(ACTIVE);
        await expect(articles).toHaveCount(LISTED.all);
        await expect(textArticle).toBeVisible();
        await expect(packageArticle).toBeVisible();
    });
});
