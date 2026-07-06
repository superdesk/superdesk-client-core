import {IBaseRestApiResponse} from 'superdesk-api';

export type IContentListType = 'manual' | 'automatic' | 'bucket';

export interface IContentList extends IBaseRestApiResponse {
    name: string;
    type: IContentListType;
    description?: string | null;
    limit?: number | null;
    cache_life_time?: number | null;
    filters?: {} | null;
    enabled?: boolean;

    // read-only; server-managed; optimistic concurrency token for bulk item updates
    content_list_items_updated_at?: string | null;
}

// read-only article projection returned with content list items
export interface IArticleContent {
    title: string;
    state: string;
    thumbnail?: string | null;
    anpa_category?: Array<{name?: string; qcode?: string}>;
    subject?: Array<{name?: string; qcode?: string}>;
    firstpublished?: string | null;
    _created?: string;
    _updated?: string;
}

export interface IContentListItem extends IBaseRestApiResponse {
    list_id?: string;
    content: string; // archive item id
    position: number;
    sticky?: boolean;
    sticky_position?: number | null;
    enabled?: boolean;
    article_content?: IArticleContent | null;
}

export type IItemChangeAction = 'add' | 'move' | 'delete';

export interface IItemChange {
    action: IItemChangeAction;
    contentId: string;
    position?: number;
    sticky?: boolean;
    stickyPosition?: number;
}

export interface IWebhook extends IBaseRestApiResponse {
    url: string;
    name?: string | null;
    enabled?: boolean;
    excluded_lists?: Array<string>;
}

export type IArticleSource = 'published' | 'in_progress' | 'scheduled';

/**
 * Common shape used for rows in both editor panes; built either from
 * an {@link IContentListItem} or from an article search result.
 */
export interface IListEntry {
    uid: string; // client-side identifier; unique within a pane (drag & drop requirement)
    contentId: string;
    title: string;
    state: string;
    category: string | null;
    updated: string | null;
    created: string | null;
    publishSchedule: string | null;
    thumbnailUrl: string | null;
    sticky: boolean;
    stickyPosition: number | null;
}
