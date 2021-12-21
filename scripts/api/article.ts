import {IArticle, IDangerousArticlePatchingOptions, IDesk, IStage} from 'superdesk-api';
import {patchArticle} from './article-patch';
import ng from 'core/services/ng';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {applicationState} from 'core/get-superdesk-api-implementation';
import {ISendToDestinationDesk, ISendToDestination} from 'core/interactive-article-actions-panel/interfaces';
import {fetchItems, fetchItemsToCurrentDesk} from './article-fetch';
import {IPublishingDateOptions} from 'core/interactive-article-actions-panel/publishing-date-options';
import {sendItems} from './article-send';

const isLocked = (_article: IArticle) => _article.lock_session != null;
const isLockedInCurrentSession = (_article: IArticle) => _article.lock_session === ng.get('session').sessionId;
const isLockedInOtherSession = (_article: IArticle) => isLocked(_article) && !isLockedInCurrentSession(_article);
const isLockedByCurrentUser = (_article: IArticle) => _article.lock_user === ng.get('session').identity._id;
const isLockedByOtherUser = (_article: IArticle) => isLocked(_article) && !isLockedByCurrentUser(_article);
const isPublished = (_article: IArticle) => _article.item_id != null;
const isArchived = (_article: IArticle) => _article._type === 'archived';
const isPersonal = (_article: IArticle) =>
    _article.task == null || _article.task.desk == null || _article.task.stage == null;

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

interface IArticleApi {
    isLocked(article: IArticle): boolean;
    isLockedInCurrentSession(article: IArticle): boolean;
    isLockedInOtherSession(article: IArticle): boolean;
    isLockedByCurrentUser(article: IArticle): boolean;
    isLockedByOtherUser(article: IArticle): boolean;
    isArchived(article: IArticle): boolean;
    isPublished(article: IArticle): boolean;
    isPersonal(article: IArticle): boolean;
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
}

export const article: IArticleApi = {
    isLocked,
    isLockedInCurrentSession,
    isLockedInOtherSession,
    isLockedByCurrentUser,
    isLockedByOtherUser,
    isArchived,
    isPublished,
    isPersonal,
    patch: patchArticle,
    doSpike,
    doUnspike,
    fetchItems,
    fetchItemsToCurrentDesk,
    sendItems,
};
