import {sdApi} from 'api';
import {appConfig, extensions} from 'appConfig';
import {ITEM_STATE, KILLED_STATES, PUBLISHED_STATES} from 'apps/archive/constants';
import {applicationState, openArticle} from 'core/get-superdesk-api-implementation';
import {dataApi} from 'core/helpers/CrudManager';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {assertNever} from 'core/helpers/typescript-helpers';
import {copyJson} from 'core/helpers/utils';
import {
    IPublishingError,
    ISendToDestination,
    ISendToDestinationDesk,
} from 'core/interactive-article-actions-panel/interfaces';
import {IPublishingDateOptions} from 'core/interactive-article-actions-panel/subcomponents/publishing-date-options';
import {notify} from 'core/notify/notify';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {flatMap, keys, pick, trim} from 'lodash';
import {
    IArticle,
    IAuthoringActionType,
    IDangerousArticlePatchingOptions,
    IDesk,
    IExtensionActivationResult,
    IStage,
    onPublishMiddlewareResult,
} from 'superdesk-api';
import {duplicateItems} from './article-duplicate';
import {fetchItems, fetchItemsToCurrentDesk} from './article-fetch';
import {patchArticle} from './article-patch';
import {sendItems} from './article-send';
import {authoringApiCommon} from 'apps/authoring-bridge/authoring-api-common';
import {CONTENT_FIELDS_DEFAULTS} from 'apps/authoring/authoring/helpers';
import _ from 'lodash';

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
    if (
        sdApi.user.hasPrivilege('publish') !== true
        || item.flags?.marked_for_not_publication === true
        || item.state === 'draft'
    ) {
        return false;
    }

    if (sdApi.navigation.isPersonalSpace() && appConfig?.features?.publishFromPersonal !== true) {
        return false;
    } else {
        const deskId = item?.task?.desk;

        if (deskId == null) {
            return false;
        }

        const desk = sdApi.desks.getAllDesks().get(deskId);

        if (desk.desk_type === 'authoring' && appConfig?.features?.noPublishOnAuthoringDesk === true) {
            return false;
        }
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

function deschedule(item: IArticle): Promise<void> {
    return httpRequestJsonLocal<IArticle>({
        method: 'PATCH',
        path: `/archive/${item._id}`,
        payload: {
            publish_schedule: null,
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

function createNewWithData(data: Partial<IArticle>, contentProfileId: string): void {
    dataApi.create('archive', {type: 'text', ...data, profile: contentProfileId})
        .then((item) => {
            openArticle(item._id, 'edit');
        });
}

function translate(
    item: IArticle,
    language: string,
): Promise<IArticle> {
    return httpRequestJsonLocal<IArticle>({
        method: 'POST',
        path: '/archive/translate',
        payload: {
            guid: item.guid,
            language: language,
            desk: sdApi.desks.getCurrentDeskId(),
        },
    });
}

/**
 * Checks if associations is with rewrite_of item then open then modal to add associations.
 * The user has options to add associated media to the current item and review the media change
 * or publish the current item without media.
 * User will be prompted in following scenarios:
 * 1. Edit feature image and confirm media update is enabled.
 * 2. Once item is published then no confirmation.
 * 3. If current item is update and updated story has associations
 */
function checkMediaAssociatedToUpdate(
    item: IArticle,
    action: string,
    autosave: (item: IArticle) => void,
): Promise<boolean> {
    if (!appConfig.features?.confirmMediaOnUpdate
        || !appConfig.features?.editFeaturedImage
        || !item.rewrite_of
        || ['kill', 'correct', 'takedown'].includes(action)
        || item.associations?.featuremedia
    ) {
        return Promise.resolve(true);
    }

    return ng.get('api').find('archive', item.rewrite_of)
        .then((rewriteOfItem) => {
            if (rewriteOfItem?.associations?.featuremedia) {
                return ng.get('confirm').confirmFeatureMedia(rewriteOfItem);
            }

            return true;
        })
        .then((result) => {
            if (result?.associations) {
                item.associations = result.associations;
                autosave(item);
                return false;
            }

            return true;
        });
}

function notifyPreconditionFailed($scope: any) {
    notify.error(gettext('Item has changed since it was opened. ' +
        'Please close and reopen the item to continue. ' +
        'Regrettably, your changes cannot be saved.'));
    $scope._editable = false;
    $scope.dirty = false;
}

interface IScope {
    item?: IArticle;
    error?: {};
    autosave?: (item: IArticle) => void;
    dirty?: boolean;
    $applyAsync?: () => void;
    origItem?: IArticle;
}

function publishItem(
    orig: IArticle,
    item: IArticle,
    action: IAuthoringActionType = 'publish',
    onError?: (error: IPublishingError) => void,
): Promise<boolean | IArticle> {
    const scope: IScope = {};

    return publishItem_legacy(orig, item, scope, action, onError)
        .then((published) => published ? scope.item : published);
}

function canPublishOnDesk(deskType: string): boolean {
    return !(deskType === 'authoring' && appConfig.features.noPublishOnAuthoringDesk) &&
        ng.get('privileges').userHasPrivileges({publish: 1});
}

function showPublishAndContinue(item: IArticle, dirty: boolean): boolean {
    return appConfig.features?.customAuthoringTopbar?.publishAndContinue
        && !sdApi.navigation.isPersonalSpace()
        && canPublishOnDesk(sdApi.desks.getDeskById(sdApi.desks.getCurrentDeskId()).desk_type)
        && authoringApiCommon.checkShortcutButtonAvailability(item, dirty);
}

function showCloseAndContinue(item: IArticle, dirty: boolean): boolean {
    return appConfig.features?.customAuthoringTopbar?.closeAndContinue
        && !sdApi.navigation.isPersonalSpace()
        && authoringApiCommon.checkShortcutButtonAvailability(item, dirty);
}

function publishItem_legacy(
    orig: IArticle,
    item: IArticle,
    scope: IScope,
    action: IAuthoringActionType = 'publish',
    onError?: (error: IPublishingError) => void,
): Promise<boolean> {
    let warnings: Array<{text: string}> = [];
    const initialValue: Promise<onPublishMiddlewareResult> = Promise.resolve({});

    scope.error = {};

    return flatMap(
        Object.values(extensions).map(({activationResult}) => activationResult),
        (activationResult) => activationResult.contributions?.entities?.article?.onPublish ?? [],
    ).reduce((current, next) => {
        return current.then((result) => {
            if ((result?.warnings?.length ?? 0) > 0) {
                warnings = warnings.concat(result.warnings);
            }

            return next(Object.assign({
                _id: orig._id,
                type: orig.type,
            }, item));
        });
    }, initialValue)
        .then((result) => {
            if ((result?.warnings?.length ?? 0) > 0) {
                warnings = warnings.concat(result.warnings);
            }

            return result;
        })
        .then(() => checkMediaAssociatedToUpdate(item, action, scope.autosave))
        .then((result) => (result && warnings.length < 1
            ? ng.get('authoring').publish(orig, item, action)
            : Promise.reject(false)
        ))
        .then((response: IArticle) => {
            notify.success(gettext('Item published.'));
            scope.item = response;
            scope.dirty = false;
            ng.get('authoringWorkspace').close(true);

            return true;
        })
        .catch((response) => {
            const issues = response.data._issues;
            const errors = issues?.['validator exception'];

            if (errors != null) {
                const modifiedErrors = errors.replace(/\[/g, '').replace(/\]/g, '').split(',');

                modifiedErrors.forEach((error) => {
                    const message = trim(error, '\' ');
                    // the message format is 'Field error text' (contains ')
                    const field = message.split(' ')[0];

                    scope.error[field.toLocaleLowerCase()] = true;
                    notify.error(message);
                });

                if (issues.fields) {
                    Object.assign(scope.error, issues.fields);
                }

                onError?.({
                    fields: scope.error,
                    kind: 'publishing-error',
                });

                scope.$applyAsync?.(); // make $scope.error changes visible

                if (errors.indexOf('9007') >= 0 || errors.indexOf('9009') >= 0) {
                    ng.get('authoring').open(item._id, true).then((res) => {
                        scope.origItem = res;
                        scope.dirty = false;
                        scope.item = copyJson(scope.origItem);
                    });
                }
            } else if (issues?.unique_name?.unique) {
                notify.error(gettext('Error: Unique Name is not unique.'));
            } else if (response && response.status === 412) {
                notifyPreconditionFailed(scope);
            } else if (warnings.length > 0) {
                warnings.forEach((warning) => notify.error(warning.text));
            }

            return Promise.reject(false);
        });
}

function edit(
    item: {
        _id: IArticle['_id'],
        _type?: IArticle['_type'],
        state?: IArticle['state']
    },
    action?: IAuthoringActionType,
): void {
    if (item != null) {
        // disable edit of external ingest sources
        // that are not editable (editFeaturedImage false or not available)

        if (
            item._type === 'externalsource'
            && !!(appConfig.features != null && appConfig.features.editFeaturedImage === false)
        ) {
            return;
        }

        ng.get('authoringWorkspace').authoringOpen(
            item._id,
            action || 'edit',
            item._type || null,
            item.state === 'being_corrected',
        );
    } else {
        ng.get('authoringWorkspace').close();
    }
}

function getItemPatchWithKillOrTakedownTemplate(item: IArticle, action: IAuthoringActionType): Promise<IArticle> {
    const itemForTemplate = {
        template_name: action,
        item: pick(
            item,
            [...(keys(CONTENT_FIELDS_DEFAULTS)), '_id', 'versioncreated', 'task'],
        ),
    };

    return httpRequestJsonLocal({
        method: 'POST',
        path: '/content_templates_apply',
        payload: itemForTemplate,
    }).then((result: IArticle) => {
        return {
            ...result,
            ...(action === 'kill' ? {operation: 'kill'} : {}),
            state: ITEM_STATE.PUBLISHED,
        };
    });
}

/**
 * Gets opened items from your workspace.
 */
function getWorkQueueItems(): Array<IArticle> {
    return ng.get('workqueue').items;
}

function get(id: IArticle['_id']): Promise<IArticle> {
    return dataApi.findOne<IArticle>('archive', id);
}

function itemAction(_article: IArticle): {[key in IAuthoringActionType]: boolean} {
    const authoring = ng.get('authoring');

    return authoring.itemActions(_article);
}

function isEditable(_article: IArticle): boolean {
    const itemState: ITEM_STATE = _article.state;
    const authoring = ng.get('authoring');

    switch (itemState) {
    case ITEM_STATE.DRAFT:
    case ITEM_STATE.CORRECTION:
    case ITEM_STATE.SUBMITTED:
    case ITEM_STATE.IN_PROGRESS:
    case ITEM_STATE.ROUTED:
    case ITEM_STATE.FETCHED:
    case ITEM_STATE.UNPUBLISHED:
        return authoring.itemActions(_article).edit === true;
    case ITEM_STATE.INGESTED:
    case ITEM_STATE.SPIKED:
    case ITEM_STATE.SCHEDULED:
    case ITEM_STATE.PUBLISHED:
    case ITEM_STATE.CORRECTED:
    case ITEM_STATE.BEING_CORRECTED:
    case ITEM_STATE.KILLED:
    case ITEM_STATE.RECALLED:
        return false;
    default:
        assertNever(itemState);
    }
}

function rewrite(item: IArticle): void {
    return ng.get('authoring').rewrite(item);
}

interface IArticleApi {
    translate(item: IArticle, language: string): Promise<IArticle>;
    get(id: IArticle['_id']): Promise<IArticle>;
    isLocked(article: IArticle): boolean;
    isEditable(article: IArticle): boolean;
    isLockedInCurrentSession(article: IArticle): boolean;
    isLockedInOtherSession(article: IArticle): boolean;
    isLockedByCurrentUser(article: IArticle): boolean;
    isLockedByOtherUser(article: IArticle): boolean;
    isArchived(article: IArticle): boolean;

    /**
     * @param includeScheduled defaults to true
     */
    isPublished(article: IArticle, includeScheduled?: boolean): boolean;

    itemAction(article: IArticle): {[key in IAuthoringActionType]: boolean};
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

    deschedule(item: IArticle): Promise<void>;

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
    createNewWithData(data: Partial<IArticle>, contentProfileId: string): void;
    getWorkQueueItems(): Array<IArticle>;
    rewrite(item: IArticle): void;
    canPublishOnDesk(deskType: string): boolean;
    showCloseAndContinue(item: IArticle, dirty: boolean): boolean;
    showPublishAndContinue(item: IArticle, dirty: boolean): boolean;
    publishItem_legacy(orig: IArticle, item: IArticle, $scope: any, action?: IAuthoringActionType): Promise<boolean>;

    getItemPatchWithKillOrTakedownTemplate(item: IArticle, action: IAuthoringActionType): Promise<IArticle>;

    // `openArticle` - a similar function exists, TODO: in the future we'll have to unify these two somehow
    edit(
        item: {
            _id: IArticle['_id'],
            _type?: IArticle['_type'],
            state?: IArticle['state']
        },
        action?: IAuthoringActionType,
    ): void;

    // Instead of passing a fake scope from React
    // every time to the publishItem_legacy we can use this function which
    // creates a fake scope for us.
    publishItem(
        orig: IArticle,
        item: IArticle,
        action?: IAuthoringActionType,

        // onError is optional in this function and in `publishItem_legacy` since when you're calling
        // it from React you want to pass only it to handle certain errors and apply them to the scope
        // but not the whole scope but from Angular you already have access to the full scope so you
        // won't need to pass onError
        onError?: (error: IPublishingError) => void,
    ): Promise<boolean | IArticle>;
}

export const article: IArticleApi = {
    translate,
    rewrite,
    isLocked,
    isEditable,
    itemAction,
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
    createNewWithData,
    getWorkQueueItems,
    get,
    canPublishOnDesk,
    showPublishAndContinue,
    showCloseAndContinue,
    publishItem_legacy,
    publishItem,
    edit,
    deschedule,
    getItemPatchWithKillOrTakedownTemplate,
};
