import {IArticle, IBaseRestApiResponse, IDangerousArticlePatchingOptions, IDesk, IStage} from 'superdesk-api';
import {patchArticle} from './article-patch';
import ng from 'core/services/ng';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {applicationState, openArticle} from 'core/get-superdesk-api-implementation';
import {ISendToDestinationDesk, ISendToDestination} from 'core/interactive-article-actions-panel/interfaces';
import {fetchItems, fetchItemsToCurrentDesk} from './article-fetch';
import {IPublishingDateOptions} from 'core/interactive-article-actions-panel/subcomponents/publishing-date-options';
import {sendItems} from './article-send';
import {duplicateItems} from './article-duplicate';
import {sdApi} from 'api';
import {appConfig} from 'appConfig';
import {KILLED_STATES, ITEM_STATE, PUBLISHED_STATES} from 'apps/archive/constants';

const isLocked = (_article: IArticle) => _article.lock_session != null;
const isLockedInCurrentSession = (_article: IArticle) => _article.lock_session === ng.get('session').sessionId;
const isLockedInOtherSession = (_article: IArticle) => isLocked(_article) && !isLockedInCurrentSession(_article);
const isLockedByCurrentUser = (_article: IArticle) => _article.lock_user === ng.get('session').identity._id;
const isLockedByOtherUser = (_article: IArticle) => isLocked(_article) && !isLockedByCurrentUser(_article);
const isPublished = (item: IArticle, includeScheduled = true) =>
    PUBLISHED_STATES.includes(item.state) &&
    (includeScheduled || item.state !== ITEM_STATE.SCHEDULED);
const isArchived = (_article: IArticle) => _article._type === 'archived';
const isPersonal = (_article: IArticle) =>
    _article.task == null || _article.task.desk == null || _article.task.stage == null;
const getPackageItemIds = (item: IArticle): Array<IArticle['_id']> => {
    const ids: Array<IArticle['_id']> = [];

    item.groups.forEach((group) => {
        if (group.id !== 'root') {
            group.refs?.forEach(({residRef}) => {
                ids.push(residRef);
            });
        }
    });

    return ids;
};

/**
 * Test if an item was published, but is not published anymore.
 */
export const isKilled = (item: IArticle) => KILLED_STATES.includes(item.state);

export const isIngested = (item: IArticle) =>
    item.state === ITEM_STATE.INGESTED;

function canPublish(item: IArticle): boolean {
    const deskId = item?.task?.desk;

    if (deskId == null) {
        return false;
    }

    const desk = sdApi.desks.getAllDesks().get(deskId);

    if (desk.desk_type === 'authoring' && appConfig?.features?.noPublishOnAuthoringDesk === true) {
        return false;
    }

    if (sdApi.user.hasPrivilege('publish') !== true) {
        return false;
    }

    return true;
}

/**
 * Does not prompt for confirmation
 */
function doSpike(item: IArticle) {
    return httpRequestJsonLocal<void>({
        method: 'PATCH',
        path: `/archive/spike/${item._id}`,
        payload: {
            state: 'spiked',
        },
        headers: {
            'If-Match': item._etag,
        },
    }).then(() => {
        const $location = ng.get('$location');

        if ($location.search()._id === item._id) {
            $location.search('_id', null);
        }

        if (applicationState.articleInEditMode === item._id) {
            ng.get('authoringWorkspace').close();
        }
    });
}

function doUnspike(item: IArticle, deskId: IDesk['_id'], stageId: IStage['_id']): Promise<void> {
    return httpRequestJsonLocal<IArticle>({
        method: 'PATCH',
        path: `/archive/unspike/${item._id}`,
        payload: {
            task: {
                desk: deskId,
                stage: stageId,
            },
        },
        headers: {
            'If-Match': item._etag,
        },
    }).then(() => {
        const $location = ng.get('$location');

        if ($location.search()._id === item._id) {
            $location.search('_id', null);
        }

        if (applicationState.articleInEditMode === item._id) {
            ng.get('authoringWorkspace').close();
        }
    });
}

function lock(itemId: IArticle['_id']): Promise<IArticle> {
    return httpRequestJsonLocal({
        method: 'POST',
        path: `/archive/${itemId}/lock`,
        payload: {
            lock_action: 'edit',
        },
    });
}

function unlock(itemId: IArticle['_id']): Promise<IArticle> {
    return httpRequestJsonLocal({
        method: 'POST',
        path: `/archive/${itemId}/unlock`,
        payload: {},
    });
}

/**
 * Item must be on a stage already.
 * i.e. can't be in personal space.
 */
function sendItemToNextStage(item: IArticle): Promise<void> {
    if (sdApi.article.isPersonal(item)) {
        throw new Error('can not send personal item to next stage');
    }

    const deskId = item.task.desk;
    const stageId = item.task.stage;
    const deskStages = sdApi.desks.getDeskStages(deskId).toArray();
    const currentStage = deskStages.find(({_id}) => _id === stageId);
    const currentStageIndex = deskStages.indexOf(currentStage);
    const nextStageIndex = currentStageIndex === deskStages.length - 1 ? 0 : currentStageIndex + 1;

    return sdApi.article.sendItems(
        [item],
        {
            type: 'desk',
            desk: deskId,
            stage: deskStages[nextStageIndex]._id,
        },
    ).then(() => undefined);
}

function createNewUsingDeskTemplate(): void {
    const desk = sdApi.desks.getDeskById(sdApi.desks.getActiveDeskId());

    sdApi.templates.getById(desk.default_content_template).then((template) => {
        ng.get('content')
            .createItemFromTemplate(template, false)
            .then((item) => {
                openArticle(item._id, 'edit');
            });
    });
}

function getWorkQueueItems(): Array<IArticle> {
    return ng.get('workqueue').items;
}

interface IArticleApi {
    isLocked(article: IArticle): boolean;
    isLockedInCurrentSession(article: IArticle): boolean;
    isLockedInOtherSession(article: IArticle): boolean;
    isLockedByCurrentUser(article: IArticle): boolean;
    isLockedByOtherUser(article: IArticle): boolean;
    isArchived(article: IArticle): boolean;

    /**
     * @param includeScheduled defaults to true
     */
    isPublished(article: IArticle, includeScheduled?: boolean): boolean;

    isKilled(article: IArticle): boolean;
    isIngested(article: IArticle): boolean;
    isPersonal(article: IArticle): boolean;
    getPackageItemIds(item: IArticle): Array<IArticle['_id']>;
    patch(
        article: IArticle,
        patch: Partial<IArticle>,
        dangerousOptions?: IDangerousArticlePatchingOptions,
    ): Promise<void>;
    doSpike(item: IArticle): Promise<void>;
    doUnspike(item: IArticle, deskId: IDesk['_id'], stageId: IStage['_id']): Promise<void>;

    fetchItems(
        items: Array<IArticle>,
        selectedDestination: ISendToDestinationDesk,
    ): Promise<Array<IArticle>>;

    fetchItemsToCurrentDesk(items: Array<IArticle>): Promise<Array<IArticle>>;

    /**
     * Promise may be rejected by middleware.
     * Returns patches, not whole items.
     */
    sendItems(
        items: Array<IArticle>,
        selectedDestination: ISendToDestination,
        sendPackageItems?: boolean,
        publishingDateOptions?: IPublishingDateOptions,
    ): Promise<Array<Partial<IArticle>>>;

    sendItemToNextStage(item: IArticle): Promise<void>;

    duplicateItems(items: Array<IArticle>, destination: ISendToDestination): Promise<Array<IArticle>>;

    canPublish(item: IArticle): boolean;

    lock(itemId: IArticle['_id']): Promise<IArticle>;
    unlock(itemId: IArticle['_id']): Promise<IArticle>;

    createNewUsingDeskTemplate(): void;
    getWorkQueueItems(): Array<IArticle>;
}

export const article: IArticleApi = {
    isLocked,
    isLockedInCurrentSession,
    isLockedInOtherSession,
    isLockedByCurrentUser,
    isLockedByOtherUser,
    isArchived,
    isPublished,
    isKilled,
    isIngested,
    isPersonal,
    getPackageItemIds,
    patch: patchArticle,
    doSpike,
    doUnspike,
    fetchItems,
    fetchItemsToCurrentDesk,
    sendItems,
    sendItemToNextStage,
    duplicateItems,
    canPublish,
    lock,
    unlock,
    createNewUsingDeskTemplate,
    getWorkQueueItems,
};
