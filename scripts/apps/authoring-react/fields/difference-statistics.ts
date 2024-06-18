import {keyBy} from 'lodash';

export interface IDifferenceStats<T> {
    added: Array<T>;
    removed: Array<T>;
    modified: Array<T>;
    reordered: Array<T>;
    noChanges: boolean;
}

export function getDifferenceStatistics<T>(
    items1: Array<T>,
    items2: Array<T>,
    getId: (item: T) => string,
    isEqual: (item1: T, item2: T) => boolean,
): IDifferenceStats<T> {
    const items1Lookup = keyBy(items1, getId);
    const items2Lookup = keyBy(items2, getId);

    const finalResults: IDifferenceStats<T> = {
        added: [],
        removed: [],
        modified: [],
        reordered: [],
        noChanges: true,
    };

    const diffHandledAlready = {};

    const handleDiff = (item1: T, item2: T) => {
        const id = getId(item2);

        if (diffHandledAlready[id] === true) {
            return;
        }

        if (items1.indexOf(item1) !== items2.indexOf(item2)) {
            finalResults.reordered.push(item2);
        }

        if (isEqual(item1, item2) !== true) {
            finalResults.modified.push(item2);
        }

        diffHandledAlready[id] = true;
    };

    for (const item2 of items2) {
        const id = getId(item2);

        if (id in items1Lookup !== true) {
            finalResults.added.push(item2);
        } else {
            const item1 = items1Lookup[id];

            handleDiff(item1, item2);
        }
    }

    for (const item1 of items1) {
        const id = getId(item1);

        if (items2Lookup.hasOwnProperty(id) !== true) {
            finalResults.removed.push(item1);
        } else {
            const item2 = items2Lookup[id];

            handleDiff(item1, item2);
        }
    }

    finalResults.noChanges =
        finalResults.added.length === 0
        && finalResults.removed.length === 0
        && finalResults.modified.length === 0
        && finalResults.reordered.length === 0;

    return finalResults;
}
