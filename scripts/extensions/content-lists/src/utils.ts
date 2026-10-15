import {IContentListItem, IItemChange, IItemChangeAction, IListEntry} from './interfaces';

function findLastIndex<T>(items: Array<T>, predicate: (item: T) => boolean): number {
    for (let i = items.length - 1; i >= 0; i--) {
        if (predicate(items[i])) {
            return i;
        }
    }

    return -1;
}

export function reorder<T>(list: Array<T>, startIndex: number, endIndex: number): Array<T> {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);

    result.splice(endIndex, 0, removed);

    return result;
}

function isPinned(entry: IListEntry): entry is IListEntry & {stickyPosition: number} {
    return entry.sticky && entry.stickyPosition != null;
}

/**
 * Re-inserts every pinned entry at its recorded sticky position
 * after any mutation of the list.
 *
 * Mirrors how the server lays the list out: pinned entries occupy their
 * absolute positions and the unpinned ones fill the remaining slots in
 * order. Pinned entries are inserted from the lowest position up so each
 * splice lands on an array that already holds every pinned entry before it;
 * moving them one at a time within the full list instead shifts the ones not
 * yet placed and puts adjacent pinned entries in the wrong order.
 */
export function fixPinnedItemsPosition(entries: Array<IListEntry>): Array<IListEntry> {
    const result = entries.filter((entry) => !isPinned(entry));

    entries
        .filter(isPinned)
        .sort((a, b) => a.stickyPosition - b.stickyPosition)
        .forEach((entry) => {
            result.splice(entry.stickyPosition, 0, entry);
        });

    return result;
}

/**
 * Moves the unpinned entry at `sourceIndex` to `destinationIndex` without
 * disturbing pinned entries, which keep their absolute positions.
 *
 * A drop onto a slot a pinned entry owns cannot land there, so the moved
 * entry continues in the direction of the drag to the nearest free slot:
 * dragging an entry down past a pinned block puts it right below the block,
 * dragging one up past it puts it right above. The remaining unpinned
 * entries keep their order and fill the other free slots.
 */
export function moveEntry(
    entries: Array<IListEntry>,
    sourceIndex: number,
    destinationIndex: number,
): Array<IListEntry> {
    const moved = entries[sourceIndex];

    if (moved == null || isPinned(moved)) {
        return entries;
    }

    const pinnedPositions = new Set(entries.filter(isPinned).map((entry) => entry.stickyPosition));
    const freeSlots = entries
        .map((_entry, index) => index)
        .filter((index) => !pinnedPositions.has(index));
    const targetSlot = sourceIndex < destinationIndex
        ? freeSlots.find((slot) => slot >= destinationIndex) ?? freeSlots[freeSlots.length - 1]
        : [...freeSlots].reverse().find((slot) => slot <= destinationIndex) ?? freeSlots[0];

    const unpinned = entries.filter((entry, index) => index !== sourceIndex && !isPinned(entry));

    unpinned.splice(freeSlots.indexOf(targetSlot), 0, moved);

    return fixPinnedItemsPosition([...unpinned, ...entries.filter(isPinned)]);
}

export function recordChange(
    changesRecord: Array<IItemChange>,
    action: IItemChangeAction,
    contentId: string,
    entries: Array<IListEntry>,
    sticky?: boolean,
): Array<IItemChange> {
    if (action === 'delete') {
        const lastAddIndex = findLastIndex(
            changesRecord,
            (change) => change.action === 'add' && change.contentId === contentId,
        );

        if (lastAddIndex !== -1) {
            const pruned = changesRecord.filter((change, index) =>
                index !== lastAddIndex
                && !(index > lastAddIndex && change.action === 'move' && change.contentId === contentId));

            return updatePositions(pruned, entries);
        }
    }

    const change: IItemChange = {action, contentId};

    if (action !== 'delete') {
        change.position = entries.findIndex((entry) => entry.contentId === contentId);
    }

    if (sticky != null) {
        change.sticky = sticky;
    }

    return updatePositions([...changesRecord, change], entries);
}

export function updatePositions(
    changesRecord: Array<IItemChange>,
    entries: Array<IListEntry>,
): Array<IItemChange> {
    return changesRecord.map((change) => {
        if (change.action === 'delete') {
            return change;
        }

        const index = entries.findIndex((entry) => entry.contentId === change.contentId);

        return {...change, position: index};
    });
}

export function getDuplicateContentIds(entries: Array<IListEntry>): Set<string> {
    const counts = new Map<string, number>();

    entries.forEach((entry) => {
        counts.set(entry.contentId, (counts.get(entry.contentId) ?? 0) + 1);
    });

    return new Set(
        Array.from(counts.entries())
            .filter(([_contentId, count]) => count > 1)
            .map(([contentId]) => contentId),
    );
}

function isToday(date: Date): boolean {
    const now = new Date();

    return date.getDate() === now.getDate()
        && date.getMonth() === now.getMonth()
        && date.getFullYear() === now.getFullYear();
}

function pad(value: number): string {
    return value.toString().padStart(2, '0');
}

/**
 * "HH:mm" for today's dates, "HH:mm, DD.MM.YYYY" otherwise.
 */
export function formatArticleTime(dateString: string | null): string {
    if (dateString == null || dateString.length < 1) {
        return '';
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return '';
    }

    const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

    return isToday(date)
        ? time
        : `${time}, ${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

function getItemThumbnailUrl(item: IContentListItem): string | null {
    const thumbnail = item.article_content?.thumbnail;

    if (thumbnail == null) {
        return null;
    }

    if (typeof thumbnail === 'string') {
        return thumbnail;
    }

    return (thumbnail as {href?: string}).href ?? null;
}

export function listItemToEntry(item: IContentListItem): IListEntry {
    return {
        uid: item._id ?? item.content,
        contentId: item.content,
        title: item.article_content?.title ?? '',
        state: item.article_content?.state ?? '',
        category: item.article_content?.anpa_category?.[0]?.name ?? null,
        updated: item.article_content?._updated ?? item._updated ?? null,
        created: item.article_content?._created ?? item._created ?? null,
        publishSchedule: null,
        thumbnailUrl: getItemThumbnailUrl(item),
        sticky: item.sticky === true,
        stickyPosition: item.sticky === true ? item.position : null,
        dangling: item.article_content == null,
    };
}
