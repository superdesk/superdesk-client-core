import {IContentListItem, IItemChange, IItemChangeAction, IListEntry} from './interfaces';

export function reorder<T>(list: Array<T>, startIndex: number, endIndex: number): Array<T> {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);

    result.splice(endIndex, 0, removed);

    return result;
}

/**
 * Moves an item from one list to another list.
 */
export function moveBetween<T>(
    source: Array<T>,
    destination: Array<T>,
    sourceIndex: number,
    destinationIndex: number,
): {source: Array<T>; destination: Array<T>} {
    const sourceClone = Array.from(source);
    const destinationClone = Array.from(destination);
    const [removed] = sourceClone.splice(sourceIndex, 1);

    destinationClone.splice(destinationIndex, 0, removed);

    return {source: sourceClone, destination: destinationClone};
}

/**
 * Re-inserts every pinned entry at its recorded sticky position
 * after any mutation of the list.
 */
export function fixPinnedItemsPosition(entries: Array<IListEntry>): Array<IListEntry> {
    let result = entries;

    result.forEach((entry, index) => {
        if (entry.sticky && entry.stickyPosition != null) {
            result = reorder(result, index, entry.stickyPosition);
        }
    });

    return result;
}

/**
 * Appends a change for the entry at `index` (or the removed entry's id for
 * deletes) and rewrites the recorded positions of all non-delete changes
 * from the entries' current indices.
 */
export function recordChange(
    changesRecord: Array<IItemChange>,
    action: IItemChangeAction,
    contentId: string,
    entries: Array<IListEntry>,
    sticky?: boolean,
): Array<IItemChange> {
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
