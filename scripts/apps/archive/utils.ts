/**
 * TODO: delete this file and update usages to use sdApi instead
 */

import {IArticle} from 'superdesk-api';
import {PUBLISHED_STATES, KILLED_STATES, ITEM_STATE} from './constants';

/**
 * Test if an item is published.
 */
export const isPublished = (item: IArticle, includeScheduled = true) =>
    PUBLISHED_STATES.includes(item.state) &&
    (includeScheduled || item.state !== ITEM_STATE.SCHEDULED);

export const isIngested = (item: IArticle) =>
    item.state === ITEM_STATE.INGESTED;

/**
 * Test if an item was published, but is not published anymore.
 */
export const isKilled = (item: IArticle) => KILLED_STATES.includes(item.state);
