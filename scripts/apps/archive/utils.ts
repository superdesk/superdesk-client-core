/**
 * TODO: delete this file and update usages to use sdApi instead
 */

import {sdApi} from 'api';
import {appConfig} from 'appConfig';
import {IArticle, IDesk, IStage} from 'superdesk-api';
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

export function getSendAndDuplicateTarget(): null | {deskId: IDesk['_id']; stageId: IStage['_id']} {
    const desk = sdApi.desks.getAllDesks().find(
        (desk) => desk.name === appConfig.features.customAuthoringTopbar.sendAndDuplicate.deskName,
    );

    if (desk == null) {
        return null;
    }

    const stageFromConfig = sdApi.desks.getDeskStages(desk._id).find(
        (desk) => desk.name === appConfig.features.customAuthoringTopbar.sendAndDuplicate.stageName,
    );

    return {
        deskId: desk._id,
        stageId: stageFromConfig != null ? stageFromConfig._id : desk.incoming_stage,
    };
}
