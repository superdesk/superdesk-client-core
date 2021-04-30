import moment from 'moment-timezone';
import {
    ISuperdesk,
    IExtensions,
    IArticle,
    IContentProfile,
    IEvents,
    IStage,
    IUser,
} from 'superdesk-api';
import {gettext, gettextPlural, stripHtmlTags} from 'core/utils';
import {getGenericListPageComponent} from './ui/components/ListPage/generic-list-page';
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
import {connectCrudManager, dataApi, dataApiByEntity} from './helpers/CrudManager';
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
} from './helpers/typescript-helpers';
import {getUrlPage, setUrlPage, urlParams} from './helpers/url';
import {downloadBlob} from './helpers/utils';
import {getLocaleForDatePicker} from './helpers/ui-framework';
import {memoize} from 'lodash';
import {Modal} from './ui/components/Modal/Modal';
import {ModalHeader} from './ui/components/Modal/ModalHeader';
import {ModalBody} from './ui/components/Modal/ModalBody';
import {ModalFooter} from './ui/components/Modal/ModalFooter';
import {SelectUser} from './ui/components/SelectUser';
import {logger} from './services/logger';
import {showModal} from './services/modalService';
import {UserAvatarFromUserId} from 'apps/users/components/UserAvatarFromUserId';
import {ArticleItemConcise} from 'core/ui/components/article-item-concise';
import {DropdownTree} from './ui/components/dropdown-tree';
import {getCssNameForExtension} from './get-css-name-for-extension';
import {Badge} from './ui/components/Badge';
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
import {Spacer} from './ui/components/Spacer';
import {appConfig} from 'appConfig';
import {httpRequestJsonLocal} from './helpers/network';
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

function getContentType(id): Promise<IContentProfile> {
    return dataApi.findOne('content_types', id);
}

export function openArticle(id: IArticle['_id'], mode: 'view' | 'edit'): Promise<void> {
    const authoringWorkspace = ng.get('authoringWorkspace');

    if (document.querySelector('[sd-monitoring-view]') == null) {
        // redirect if outside monitoring view
        setUrlPage('/workspace/monitoring');
    }

    authoringWorkspace.edit({_id: id}, mode);

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

let applicationState: Writeable<ISuperdesk['state']> = {
    articleInEditMode: undefined,
};

addEventListener('articleEditStart', (article) => {
    applicationState.articleInEditMode = article._id;
});

addEventListener('articleEditEnd', () => {
    delete applicationState['articleInEditMode'];
});

export function isLockedInCurrentSession(article: IArticle): boolean {
    return ng.get('lock').isLockedInCurrentSession(article);
}

export function isLockedInOtherSession(article: IArticle): boolean {
    return sdApi.article.isLocked(article) && !isLockedInCurrentSession(article);
}

export const formatDate = (date: Date | string) => (
    moment(date)
        .tz(appConfig.defaultTimezone)
        .format(appConfig.view.dateformat)
);

export function getRelativeOrAbsoluteDateTime(
    datetimeString: string,
    format: string,
    relativeDuration: number = 1,
    relativeUnit: string = 'days',
): string {
    const datetime = moment(datetimeString);

    if (datetime.isSameOrAfter(moment().subtract(relativeDuration, relativeUnit))) {
        return datetime.fromNow();
    }

    return datetime
        .tz(appConfig.defaultTimezone)
        .format(format);
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
        },
        httpRequestJsonLocal,
        getExtensionConfig: () => extensions[requestingExtensionId]?.configuration ?? {},
        entities: {
            article: {
                isPersonal: sdApi.article.isPersonal,
                isLocked: sdApi.article.isLocked,
                isLockedInCurrentSession: sdApi.article.isLockedInCurrentSession,
                isLockedInOtherSession: sdApi.article.isLockedInOtherSession,
                patch: (article, patch, dangerousOptions) => {
                    const onPatchBeforeMiddlewares = Object.values(extensions)
                        .map((extension) => extension.activationResult?.contributions?.entities?.article?.onPatchBefore)
                        .filter((middleware) => middleware != null);

                    return onPatchBeforeMiddlewares.reduce(
                        (current, next) => current.then((result) => next(article._id, result, dangerousOptions)),
                        Promise.resolve(patch),
                    ).then((patchFinal) => {
                        return dataApi.patchRaw<IArticle>(
                            // distinction between handling published and non-published items
                            // should be removed: SDESK-4687
                            (sdApi.article.isPublished(article) ? 'published' : 'archive'),
                            article._id,
                            article._etag,
                            patchFinal,
                        ).then((res) => {
                            if (dangerousOptions?.patchDirectlyAndOverwriteAuthoringValues === true) {
                                dispatchInternalEvent(
                                    'dangerouslyOverwriteAuthoringData',
                                    {...patch, _etag: res._etag, _id: res._id},
                                );
                            }
                        });
                    }).catch((err) => {
                        if (err instanceof Error) {
                            logger.error(err);
                        }
                    });
                },
                isArchived: sdApi.article.isArchived,
                isPublished: (article) => sdApi.article.isPublished(article),
            },
            desk: {
                getStagesOrdered: (deskId: string) =>
                    dataApi.query<IStage>('stages', 1, {field: '_id', direction: 'ascending'}, {desk: deskId}, 200)
                        .then((response) => response._items),
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
                getVocabulary: (id: string) => metadata.initialize().then(() => metadata.values[id]),
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
        },
        state: applicationState,
        instance: {
            config,
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
            },
            alert: (message: string) => modal.alert({bodyText: message}),
            confirm: (message: string, title?: string) => new Promise((resolve) => {
                modal.confirm(message, title ?? gettext('Cancel'))
                    .then(() => resolve(true))
                    .catch(() => resolve(false));
            }),
            showModal,
            notify: notify,
            framework: {
                getLocaleForDatePicker,
            },
        },
        components: {
            UserHtmlSingleLine,
            getGenericListPageComponent,
            connectCrudManager,
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
            Modal,
            ModalHeader,
            ModalBody,
            ModalFooter,
            Badge,
            SelectUser,
            UserAvatar: UserAvatarFromUserId,
            ArticleItemConcise,
            GroupLabel,
            TopMenuDropdownButton,
            Icon,
            IconBig,
            getDropdownTree: () => DropdownTree,
            Spacer,
            getLiveQueryHOC: () => WithLiveQuery,
            WithLiveResources,
        },
        forms: {
            FormFieldType,
            generateFilterForServer,
            isIFormGroupCollapsible,
            isIFormGroup,
            isIFormField,
            getFormFieldPreviewComponent,
        },
        localization: {
            gettext: (message, params) => gettext(message, params),
            gettextPlural: (count, singular, plural, params) => gettextPlural(count, singular, plural, params),
            formatDate: formatDate,
            formatDateTime: (date: Date) => {
                return moment(date)
                    .tz(appConfig.defaultTimezone)
                    .format(appConfig.view.dateformat + ' ' + appConfig.view.timeformat);
            },
            longFormatDateTime: (date: Date | string) => {
                return moment(date)
                    .tz(appConfig.defaultTimezone)
                    .format(appConfig.longDateFormat || 'LLL');
            },
            getRelativeOrAbsoluteDateTime: getRelativeOrAbsoluteDateTime,
        },
        privileges: {
            getOwnPrivileges: () => privileges.loaded.then(() => privileges.privileges),
            hasPrivilege: (privilege: string) => privileges.userHasPrivileges({[privilege]: 1}),
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
            getCurrentUserId: () => session.identity._id,
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
            dateToServerString: (date: Date) => {
                return date.toISOString().slice(0, 19) + '+0000';
            },
            memoize: memoizeLocal,
            generatePatch,
            stripHtmlTags,
            getLinesCount,
            downloadBlob,
            throttleAndCombineArray,
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
