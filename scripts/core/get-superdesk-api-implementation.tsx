import moment from 'moment-timezone';
import {
    ISuperdesk,
    IExtensions,
    IArticle,
    IContentProfile,
    IEvents,
    IStage,
    IUser,
    IBaseRestApiResponse,
    IPatchResponseExtraFields,
} from 'superdesk-api';
import {
    gettext,
    gettextPlural,
    stripBaseRestApiFields,
    stripHtmlTags,
    stripLockingFields,
    getProjectedFieldsArticle,
    getArticleLabel,
} from 'core/utils';
import {ListItem, ListItemColumn, ListItemRow, ListItemActionsMenu} from './components/ListItem';
import {getFormFieldPreviewComponent} from './ui/components/generic-form/form-field';
import {
    isIFormGroupCollapsible,
    isIFormGroup,
    isIFormField,
    FormFieldType,
} from './ui/components/generic-form/interfaces/form';
import {UserHtmlSingleLine} from './helpers/UserHtmlSingleLine';
import {Row, Item, Column} from './ui/components/List';
import {dataApi, dataApiByEntity} from './helpers/CrudManager';
import {elasticsearchApi} from './helpers/elasticsearch';
import {generateFilterForServer} from './ui/components/generic-form/generate-filter-for-server';
import {
    assertNever,
    Writeable,
    filterUndefined,
    filterKeys,
    stringToNumber,
    numberToString,
    notNullOrUndefined,
    nameof,
    isNullOrUndefined,
} from './helpers/typescript-helpers';
import {getUrlPage, setUrlPage, urlParams} from './helpers/url';
import {getLocaleForDatePicker} from './helpers/ui-framework';
import {memoize, omit} from 'lodash';
import {SelectUser} from './ui/components/SelectUser';
import {logger} from './services/logger';
import {UserAvatarFromUserId} from 'apps/users/components/UserAvatarFromUserId';
import {ArticleItemConcise} from 'core/ui/components/article-item-concise';
import {DropdownTree} from './ui/components/dropdown-tree';
import {getCssNameForExtension} from './get-css-name-for-extension';
import {Badge} from './ui/components/Badge';
import {MoreActionsButton} from './ui/components/MoreActionsButton';
import {
    getWebsocketMessageEventName,
    isWebsocketEventPublic,
} from './notification/notification';
import {Grid} from './ui/components/grid';
import {Alert} from './ui/components/alert';
import {Figure} from './ui/components/figure';
import {DropZone} from './ui/components/drop-zone';
import {GroupLabel} from './ui/components/GroupLabel';
import {TopMenuDropdownButton} from './ui/components/TopMenuDropdownButton';
import {dispatchInternalEvent} from './internal-events';
import {Icon} from './ui/components/Icon2';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import ng from 'core/services/ng';
import {Spacer, SpacerBlock, SpacerInlineFlex} from './ui/components/Spacer';
import {appConfig, authoringReactViewEnabled} from 'appConfig';
import {httpRequestJsonLocal, httpRequestVoidLocal, httpRequestRawLocal} from './helpers/network';
import {memoize as memoizeLocal} from './memoize';
import {generatePatch} from './patch';
import {getLinesCount} from 'apps/authoring/authoring/components/line-count';
import {attachmentsApi} from 'apps/authoring/attachments/attachmentsService';
import {notify} from './notify/notify';
import {sdApi} from 'api';
import {IconBig} from './ui/components/IconBig';
import {throttleAndCombineArray} from './itemList/throttleAndCombine';
import {WithLiveQuery} from './with-live-query';
import {WithLiveResources} from './with-resources';
import {querySelectorParent} from './helpers/dom/querySelectorParent';
import {showIgnoreCancelSaveDialog} from './ui/components/IgnoreCancelSaveDialog';
import {Editor3Html} from './editor3/Editor3Html';
import {arrayToTree, treeToArray} from './helpers/tree';
import {AuthoringWidgetHeading} from 'apps/dashboard/widget-heading';
import {AuthoringWidgetLayout} from 'apps/dashboard/widget-layout';
import {patchArticle} from 'api/article-patch';
import {connectCrudManagerHttp} from './helpers/crud-manager-http';
import {GenericArrayListPageComponent} from './helpers/generic-array-list-page-component';
import {getGenericHttpEntityListPageComponent} from 'core/ui/components/ListPage/generic-list-page';
import {Center} from './ui/components/Center';
import {InputLabel} from './ui/components/input-label';
import {VirtualListFromQuery} from './ui/components/virtual-lists/virtual-list-from-query';
import {SelectFromEndpoint} from './ui/components/virtual-lists/select';
import {DateTime} from './ui/components/DateTime';
import {AuthoringReact} from 'apps/authoring-react/authoring-react';
import {computeEditor3Output} from 'apps/authoring-react/field-adapters/utilities/compute-editor3-output';
import {getContentStateFromHtml} from './editor3/html/from-html';
import {getInlineCommentsWidgetGeneric} from 'apps/authoring-react/generic-widgets/inline-comments';
import {getCommentsWidgetGeneric} from 'apps/authoring-react/generic-widgets/comments';
import {
    isLockedInOtherSession,
    isLockedInCurrentSession,
    LockInfoHttp,
    LockInfo,
} from 'apps/authoring-react/subcomponents/lock-info-generic';
import {tryLocking, tryUnlocking} from './helpers/locking-helpers';
import {showPopup} from './ui/components/popupNew';
import {Card} from './ui/components/Card';
import {getTextColor} from './helpers/utils';
import {showModal} from '@superdesk/common';
import {showConfirmationPrompt} from './ui/show-confirmation-prompt';
import {toElasticQuery} from './query-formatting';
import {getCustomFieldVocabularies, getLanguageVocabulary} from './helpers/business-logic';
import {PreviewFieldType} from 'apps/authoring/preview/previewFieldByType';
import {getLabelNameResolver} from 'apps/workspace/helpers/getLabelForFieldId';
import {getSortedFields, getSortedFieldsFiltered} from 'apps/authoring/preview/utils';
import {editor3ToOperationalFormat} from 'apps/authoring-react/fields/editor3';
import {onTranslateActions} from 'apps/monitoring/directives/MonitoringView';

function getContentType(id): Promise<IContentProfile> {
    return dataApi.findOne('content_types', id);
}

export function openArticle(id: IArticle['_id'], mode: 'view' | 'edit' | 'edit-new-window'): Promise<void> {
    const authoringWorkspace = ng.get('authoringWorkspace');

    if (mode === 'edit-new-window') {
        authoringWorkspace.popupFromId(id, 'view');
    } else {
        const {currentPathStartsWith} = sdApi.navigation;

        if (
            currentPathStartsWith(['workspace']) !== true
            && currentPathStartsWith(['search']) !== true
        ) {
            setUrlPage('/workspace/monitoring');
        }

        authoringWorkspace.edit({_id: id}, mode);
    }

    return Promise.resolve();
}

const getContentTypeMemoized = memoize(getContentType);
let getContentTypeMemoizedLastCall: number = 0; // unix time

export const getCustomEventNamePrefixed = (name: keyof IEvents) => 'internal-event--' + name;

// stores a map between custom callback & callback passed to DOM
// so the original event listener can be removed later
const customEventMap = new Map();

export const addEventListener = <T extends keyof IEvents>(eventName: T, callback: (arg: IEvents[T]) => void) => {
    const handlerWrapper = (customEvent: CustomEvent) => callback(customEvent.detail);

    customEventMap.set(callback, handlerWrapper);

    window.addEventListener(getCustomEventNamePrefixed(eventName), handlerWrapper);
};

export const removeEventListener = <T extends keyof IEvents>(eventName: T, callback: (arg: IEvents[T]) => void) => {
    const handlerWrapper = customEventMap.get(callback);

    if (handlerWrapper != null) {
        window.removeEventListener(getCustomEventNamePrefixed(eventName), handlerWrapper);
        customEventMap.delete(callback);
    }
};

export const dispatchCustomEvent = <T extends keyof IEvents>(eventName: T, payload: IEvents[T]) => {
    window.dispatchEvent(
        new CustomEvent(getCustomEventNamePrefixed(eventName), {detail: payload}),
    );
};

export function prepareExternalImageForDroppingToEditor(
    event: DragEvent,
    renditions: IArticle['renditions'],
    additionalData?: Partial<IArticle>,
) {
    const item: Partial<IArticle> = {
        _fetchable: false,
        _type: 'externalsource',
        ...(additionalData ?? {}),
        type: 'picture',
        renditions: renditions,
    };

    event.dataTransfer.setData(
        'application/superdesk.item.picture',
        JSON.stringify(item),
    );
}

export let applicationState: Writeable<ISuperdesk['state']> = {
    articleInEditMode: undefined,
};

addEventListener('articleEditStart', (article) => {
    applicationState.articleInEditMode = article._id;
});

addEventListener('articleEditEnd', () => {
    delete applicationState['articleInEditMode'];
});

export function isArticleLockedInCurrentSession(article: IArticle): boolean {
    return ng.get('lock').isLockedInCurrentSession(article);
}

export const formatDate = (date: Date | string) => (
    moment(date)
        .tz(appConfig.default_timezone)
        .format(appConfig.view.dateformat)
);

export function dateToServerString(date: Date) {
    return date.toISOString().slice(0, 19) + '+0000';
}

export function getRelativeOrAbsoluteDateTime(
    datetimeString: string,
    format: string,
    relativeDuration: number = 1,
    relativeUnit: moment.unitOfTime.Diff = 'days',
): string {
    const datetime = moment(datetimeString);

    if (datetime.isSameOrAfter(moment().subtract(relativeDuration, relativeUnit))) {
        return datetime.fromNow();
    }

    return datetime
        .tz(appConfig.default_timezone)
        .format(format);
}

export function fixPatchRequest<T extends {}>(entity: T): T {
    return stripLockingFields(stripBaseRestApiFields(entity)) as unknown as T;
}

export function fixPatchResponse<T extends IBaseRestApiResponse>(
    entity: T & IPatchResponseExtraFields,
): T {
    return omit(entity, ['_status']) as unknown as T;
}

// imported from planning
export function getSuperdeskApiImplementation(
    requestingExtensionId: string,
    extensions: IExtensions,
    modal,
    privileges,
    lock,
    session,
    authoringWorkspace: AuthoringWorkspaceService,
    config,
    metadata,
    preferencesService,
): ISuperdesk {
    return {
        dataApi: dataApi,
        dataApiByEntity,
        elasticsearch: elasticsearchApi,
        helpers: {
            assertNever,
            filterUndefined,
            filterKeys,
            stringToNumber,
            numberToString,
            notNullOrUndefined,
            isNullOrUndefined,
            nameof: nameof,
            stripBaseRestApiFields,
            fixPatchRequest,
            fixPatchResponse,
            computeEditor3Output,
            editor3ToOperationalFormat: editor3ToOperationalFormat,
            getContentStateFromHtml: (html) => getContentStateFromHtml(html),
            tryLocking,
            tryUnlocking,
            superdeskToElasticQuery: toElasticQuery,
            getArticleLabel,
        },
        httpRequestJsonLocal,
        httpRequestRawLocal,
        httpRequestVoidLocal,
        getExtensionConfig: () => extensions[requestingExtensionId]?.configuration ?? {},
        entities: {
            article: {
                isPersonal: sdApi.article.isPersonal,
                isLocked: sdApi.article.isLocked,
                isLockedInCurrentSession: sdApi.article.isLockedInCurrentSession,
                isLockedInOtherSession: sdApi.article.isLockedInOtherSession,
                patch: patchArticle,
                createNewWithData: sdApi.article.createNewWithData,
                isArchived: sdApi.article.isArchived,
                isPublished: (article) => sdApi.article.isPublished(article),
                itemAction: (article) => sdApi.article.itemAction(article),
                getProjectedFieldsArticle: getProjectedFieldsArticle,
                getLabelNameResolver: getLabelNameResolver,
                getSortedFields: getSortedFields,
                getSortedFieldsFiltered: getSortedFieldsFiltered,
            },
            desk: {
                getStagesOrdered: (deskId: string) =>
                    dataApi.query<IStage>('stages', 1, {field: '_id', direction: 'ascending'}, {desk: deskId}, 200)
                        .then((response) => response._items),
                getActiveDeskId: sdApi.desks.getActiveDeskId,
                waitTilReady: sdApi.desks.waitTilReady,
                getDeskById: sdApi.desks.getDeskById,
            },
            contentProfile: {
                get: (id) => {
                    // Adding simple caching since the function will be called multiple times per second.

                    // TODO: implement synchronous API(and a cache) for accessing
                    // most user settings including content profiles.

                    const timestamp = Date.now();

                    // cache for 5 seconds
                    if (timestamp - getContentTypeMemoizedLastCall > 5000) {
                        getContentTypeMemoized.cache.clear();
                    }

                    getContentTypeMemoizedLastCall = timestamp;

                    return getContentTypeMemoized(id);
                },
            },
            vocabulary: {
                getIptcSubjects: () => metadata.initialize().then(() => metadata.values.subjectcodes),
                getVocabulary: (id: string) => sdApi.vocabularies.getAll().get(id),
                getCustomFieldVocabularies: getCustomFieldVocabularies,
                getLanguageVocabulary: getLanguageVocabulary,
            },
            attachment: attachmentsApi,
            users: {
                getUsersByIds: (ids) => (
                    dataApi.query<IUser>(
                        'users',
                        1,
                        {field: 'display_name', direction: 'ascending'},
                        {_id: {$in: ids}},
                        200,
                    )
                        .then((response) => response._items)
                ),
            },
            templates: {
                getUserTemplates: sdApi.templates.getUserTemplates,
            },
        },
        state: applicationState,
        instance: {
            config,
            authoringReactViewEnabled,
        },
        ui: {
            article: {
                view: (id: IArticle['_id']) => {
                    openArticle(id, 'view');
                },
                addImage: (field: string, image: IArticle) => {
                    dispatchInternalEvent('addImage', {field, image});
                },
                save: () => {
                    dispatchInternalEvent('saveArticleInEditMode', null);
                },
                prepareExternalImageForDroppingToEditor,
            },
            showModal: (Component: React.ComponentType<{closeModal(): void}>, containerClass?: string) => {
                return showModal(Component, containerClass);
            },
            alert: (message: string) => modal.alert({bodyText: message}),
            confirm: (message: string, title?: string) => showConfirmationPrompt({
                title: title ?? gettext('Confirm'),
                message,
            }),
            showIgnoreCancelSaveDialog,
            notify: notify,
            framework: {
                getLocaleForDatePicker,
            },
        },
        components: {
            UserHtmlSingleLine,
            getGenericHttpEntityListPageComponent,
            getGenericArrayListPageComponent: () => GenericArrayListPageComponent,
            connectCrudManagerHttp: connectCrudManagerHttp,
            getVirtualListFromQuery: () => VirtualListFromQuery,
            SelectFromEndpoint,
            ListItem,
            ListItemColumn,
            ListItemRow,
            ListItemActionsMenu,
            List: {
                // there's no full React implementation of ListItem component
                // https://superdesk.github.io/superdesk-ui-framework/dist/#/list-item
                // as operator is used in order to prevent exposing more props
                // so it's easier to remove old usages when we have a full implementation
                Item: Item as React.ComponentType<{onClick: any}>,
                Row: Row as React.ComponentType,
                Column: Column as React.ComponentType<{grow: boolean}>,
            },
            Grid,
            Alert,
            Figure,
            DropZone,
            Badge,
            MoreActionsButton,
            SelectUser,
            UserAvatar: UserAvatarFromUserId,
            ArticleItemConcise,
            GroupLabel,
            InputLabel,
            TopMenuDropdownButton,
            Icon,
            IconBig,
            getAuthoringComponent: () => AuthoringReact,
            getLockInfoHttpComponent: () => LockInfoHttp,
            getLockInfoComponent: () => LockInfo,
            getDropdownTree: () => DropdownTree,
            Center,
            Spacer,
            SpacerBlock,
            SpacerInlineFlex,
            getLiveQueryHOC: () => WithLiveQuery,
            WithLiveResources,
            Editor3Html,
            AuthoringWidgetHeading,
            AuthoringWidgetLayout,
            DateTime,
            Card,
            showPopup,
            authoring: {
                PreviewFieldType,
            },
        },
        forms: {
            FormFieldType,
            generateFilterForServer,
            isIFormGroupCollapsible,
            isIFormGroup,
            isIFormField,
            getFormFieldPreviewComponent,
        },
        authoringGeneric: {
            onTranslateActions: onTranslateActions,
            sideWidgets: {
                inlineComments: getInlineCommentsWidgetGeneric(),
                comments: (
                    getComments,
                    addComment,
                    isAllowed,
                ) => getCommentsWidgetGeneric(getComments, addComment, isAllowed),
            },
        },
        localization: {
            gettext: (message, params) => gettext(message, params),
            gettextPlural: (count, singular, plural, params) => gettextPlural(count, singular, plural, params),
            formatDate: formatDate,
            formatDateTime: (date: Date) => {
                return moment(date)
                    .tz(appConfig.default_timezone)
                    .format(appConfig.view.dateformat + ' ' + appConfig.view.timeformat);
            },
            longFormatDateTime: (date: Date | string) => {
                return moment(date)
                    .tz(appConfig.default_timezone)
                    .format(appConfig.longDateFormat || 'LLL');
            },
            getRelativeOrAbsoluteDateTime: getRelativeOrAbsoluteDateTime,
        },
        privileges: {
            getOwnPrivileges: () => privileges.loaded.then(() => privileges.privileges),
            hasPrivilege: (privilege: string) => sdApi.user.hasPrivilege(privilege),
        },
        preferences: {
            get: (key) => {
                return preferencesService.get().then((res: Dictionary<string, any>) => {
                    return res?.extensions?.[requestingExtensionId]?.[key] ?? null;
                });
            },
            set: (key, value) => {
                return preferencesService.get().then((res: Dictionary<string, any>) => {
                    const extensionsPreferences = res.extensions ?? {};

                    if (extensionsPreferences[requestingExtensionId] == null) {
                        extensionsPreferences[requestingExtensionId] = {};
                    }

                    extensionsPreferences[requestingExtensionId][key] = value;

                    return preferencesService.update({extensions: extensionsPreferences});
                });
            },
        },
        session: {
            getToken: () => session.token,
            getCurrentUser: () => session.getIdentity(),
            getSessionId: () => session.sessionId,
            getCurrentUserId: () => sdApi.user.getCurrentUserId(),
        },
        browser: {
            location: {
                getPage: getUrlPage,
                setPage: setUrlPage,
                urlParams: urlParams,
            },
        },
        utilities: {
            logger,
            CSS: {
                getClass: (originalName: string) => getCssNameForExtension(originalName, requestingExtensionId),
                getId: (originalName: string) => getCssNameForExtension(originalName, requestingExtensionId),
            },
            dateToServerString,
            memoize: memoizeLocal,
            generatePatch,
            stripHtmlTags,
            getLinesCount,
            throttleAndCombineArray,
            querySelectorParent,
            arrayToTree,
            treeToArray,
            isLockedInOtherSession,
            isLockedInCurrentSession,
            getTextColor,
        },
        addWebsocketMessageListener: (eventName, handler) => {
            const eventNameFinal = getWebsocketMessageEventName(
                eventName,
                isWebsocketEventPublic(eventName) ? undefined : requestingExtensionId,
            );

            window.addEventListener(eventNameFinal, handler);

            return () => {
                window.removeEventListener(eventNameFinal, handler);
            };
        },
        addEventListener,
        removeEventListener,
        dispatchEvent: dispatchCustomEvent,
    };
}
