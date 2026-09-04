import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';

/**
 * The active toggle is only expressed as a CSS class; these anchors carry no
 * aria-pressed or other state attribute.
 */
const ACTIVE = /toggle-button--active/;

/**
 * Internal item type and its button label, in the order the buttons are rendered.
 */
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

/**
 * How many items each filter leaves in the Sports monitoring groups, given the `main` snapshot.
 * It holds four text items ("test sports story", "story 2", "Story 3" and the published
 * "Story 5") plus "Package Highlight 1", a package carrying a highlight, which the `composite`
 * filter deliberately excludes (`CardsService.setQueryFiltersForFileType` matches non-highlight
 * packages only). The snapshot has no picture, graphic, video or audio item, so those filters
 * can only be shown to empty the list, never to select items of their own type.
 */
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

/**
 * Well above the default 30s: opening monitoring can cost a reload (see
 * `Monitoring.openMonitoringForDesk`) and each of the 14 filter changes below waits out the
 * group's 1s query debounce plus the round trip.
 */
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

    /**
     * Selecting a type does not re-render the list synchronously: the monitoring group schedules a
     * debounced query (1s) and leaves the previously rendered items in the DOM until the new
     * response lands. Asserting that an already visible item is still visible would therefore pass
     * against the stale list, so each step below waits on the resulting item count, which can only
     * settle once the filtered query has landed, before checking which items survived.
     */
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
