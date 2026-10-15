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
        dangling: false,
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
 * Scheduled items are a published state (see PUBLISHED_STATES in core), so they
 * live in the /published collection and never appear in the archive repo.
 * Both the published and the scheduled tab therefore query /published.
 *
 * That collection keeps every published version of a story (the original plus
 * each correction), and a correction's state becomes "corrected" rather than
 * "published" — so filtering on state === 'published' would only match stale
 * originals. Instead, superseded versions are dropped via last_published_version,
 * yielding one current entry per story.
 *
 * The published tab then excludes the states that are not "currently published":
 * killed and recalled, plus scheduled, which belongs to its own tab.
 */
function getPublishedQuery(source: 'published' | 'scheduled', searchString: string, from: number): {} {
    const must: Array<{}> = [{term: {type: 'text'}}];
    const mustNot: Array<{}> = [{term: {last_published_version: false}}];

    if (source === 'scheduled') {
        must.push({term: {state: 'scheduled'}});
    } else {
        mustNot.push({terms: {state: ['killed', 'recalled', 'scheduled']}});
    }

    if (searchString.length > 0) {
        must.push(getQueryStringFilter(searchString));
    }

    return {
        query: {
            bool: {
                must,
                must_not: mustNot,
            },
        },
        from,
        size: PAGE_SIZE,
        sort: [{versioncreated: 'desc'}],
    };
}

/**
 * A plain bool query is required here too — the `filtered` query was removed in ES5.
 */
function getArchiveQuery(state: 'in_progress', searchString: string, from: number): {} {
    const must: Array<{}> = [{term: {state}}, {term: {type: 'text'}}];

    if (searchString.length > 0) {
        must.push(getQueryStringFilter(searchString));
    }

    return {
        query: {bool: {must}},
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

    const request = source === 'in_progress'
        ? httpRequestJsonLocal<IRestApiResponse<IArticle>>({
            method: 'GET',
            path: '/search',
            urlParams: {repo: 'archive', source: getArchiveQuery(source, searchString, from)},
        })
        : httpRequestJsonLocal<IRestApiResponse<IArticle>>({
            method: 'GET',
            path: '/published',
            urlParams: {source: getPublishedQuery(source, searchString, from)},
        });

    return request.then((response) => ({
        entries: response._items.map(toListEntry),
        total: response._meta.total,
    }));
}
