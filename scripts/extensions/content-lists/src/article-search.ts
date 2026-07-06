import {IArticle, IRestApiResponse} from 'superdesk-api';
import {PAGE_SIZE} from './constants';
import {IArticleSource, IListEntry} from './interfaces';
import {superdesk} from './superdesk';

const {httpRequestJsonLocal} = superdesk;

export interface IArticleSearchResult {
    entries: Array<IListEntry>;
    total: number;
}

function getThumbnailUrl(article: IArticle): string | null {
    const renditions = article.associations?.featuremedia?.renditions;

    return renditions?.thumbnail?.href ?? renditions?.viewImage?.href ?? null;
}

function toListEntry(article: IArticle): IListEntry {
    const contentId = article.guid ?? article._id;

    return {
        uid: contentId,
        contentId,
        title: article.headline ?? '',
        state: article.state,
        category: article.anpa_category?.[0]?.name ?? null,
        updated: article._updated ?? article.versioncreated ?? null,
        created: article._created ?? article.firstcreated ?? null,
        publishSchedule: article.publish_schedule ?? null,
        thumbnailUrl: getThumbnailUrl(article),
        sticky: false,
        stickyPosition: null,
    };
}

function getQueryStringFilter(searchString: string): {} {
    return {
        query_string: {
            query: searchString,
            lenient: true,
            default_operator: 'AND',
        },
    };
}

/**
 * The /published collection keeps every published version of a story (the
 * original plus each correction), and a correction's state becomes "corrected"
 * rather than "published" — so filtering on state === 'published' would only
 * match stale originals. Instead, superseded versions are dropped via
 * last_published_version and killed/recalled are excluded, yielding one
 * current entry per story. A plain bool query is required (the `filtered`
 * query was removed in ES5).
 */
function getPublishedQuery(searchString: string, from: number): {} {
    const must: Array<{}> = [{term: {type: 'text'}}];

    if (searchString.length > 0) {
        must.push(getQueryStringFilter(searchString));
    }

    return {
        query: {
            bool: {
                must,
                must_not: [
                    {term: {last_published_version: false}},
                    {terms: {state: ['killed', 'recalled']}},
                ],
            },
        },
        from,
        size: PAGE_SIZE,
        sort: [{versioncreated: 'desc'}],
    };
}

function getArchiveQuery(state: 'in_progress' | 'scheduled', searchString: string, from: number): {} {
    interface IFilteredQuery {
        filter: {};
        query?: {};
    }

    const filtered: IFilteredQuery = {
        filter: {
            and: [{term: {state}}, {term: {type: 'text'}}],
        },
    };

    if (searchString.length > 0) {
        filtered.query = getQueryStringFilter(searchString);
    }

    return {
        query: {filtered},
        from,
        size: PAGE_SIZE,
        sort: [{versioncreated: 'desc'}],
    };
}

export function searchArticles(
    source: IArticleSource,
    searchString: string,
    page: number, // zero-based
): Promise<IArticleSearchResult> {
    const from = page * PAGE_SIZE;

    const request = source === 'published'
        ? httpRequestJsonLocal<IRestApiResponse<IArticle>>({
            method: 'GET',
            path: '/published',
            urlParams: {source: getPublishedQuery(searchString, from)},
        })
        : httpRequestJsonLocal<IRestApiResponse<IArticle>>({
            method: 'GET',
            path: '/search',
            urlParams: {repo: 'archive', source: getArchiveQuery(source, searchString, from)},
        });

    return request.then((response) => ({
        entries: response._items.map(toListEntry),
        total: response._meta.total,
    }));
}
