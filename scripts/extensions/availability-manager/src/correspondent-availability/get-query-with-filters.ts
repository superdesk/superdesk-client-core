import {IComparison, ISuperdeskQuery} from 'superdesk-api';
import {nameof} from '@sourcefabric/common';
import {IAvailabilityRecord, IFilters} from '../interfaces';
import {superdesk} from '../superdesk';
import {TAGS_VOCABULARY_ID} from '../constants';
import {formatDateIso} from '../utils';

const {arrayToTree, treeToArray, getTreeParents, buildTreeDictionary} = superdesk.utilities;

export function getQueryWithFilters(filters: IFilters): ISuperdeskQuery {
    const where: Array<IComparison> = [
        {[nameof<IAvailabilityRecord>('date')]: {$gte: formatDateIso(filters.date)}},
        {[nameof<IAvailabilityRecord>('date')]: {$lte: formatDateIso(filters.date)}},
    ];

    if (filters.language.length > 0) {
        where.push(
            {[nameof<IAvailabilityRecord>('language')]: {$in: filters.language}},
        );
    }

    if (filters.status.length > 0) {
        where.push(
            {[nameof<IAvailabilityRecord>('status')]: {$in: filters.status.map(({code}) => code)}},
        );
    }

    if (filters.tags.length > 0) {
        const tagsVocabulary = superdesk.entities.vocabulary.getVocabulary(TAGS_VOCABULARY_ID);
        const tagsTree = arrayToTree(
            tagsVocabulary.items,
            ({qcode}) => qcode,
            ({parent}) => parent,
        ).result;

        const lookup = buildTreeDictionary(tagsTree, (node) => node.value.qcode);

        // include children
        const tagIds: Array<string> = filters.tags.flatMap(({code}) => {
            const branch = lookup[code];

            if (branch == null) {
                return [];
            } else {
                return treeToArray([branch]).map(({qcode}) => qcode);
            }
        });

        // include parents
        for (const parent of getTreeParents(filters.tags.map(({code}) => lookup[code]))) {
            tagIds.push(parent.value.qcode);
        }

        where.push(
            {
                'working_hours.tags': {
                    $in: tagIds.map((id) => ({code: id})),
                },
            },
        );
    }

    const query: ISuperdeskQuery = {
        filter: {
            $and: where,
        },
        page: 1,
        max_results: 200,
        sort: [{'versioncreated': 'asc'}], // sorting isn't relevant
    };

    return query;
}
