import moment from 'moment-timezone';
import {
    ISuperdesk,
    IExtensions,
    IArticle,
    IContentProfile,
    IEvents,
    IStage,
} from 'superdesk-api';
import {gettext, gettextPlural} from 'core/utils';
import {getGenericListPageComponent} from './ui/components/ListPage/generic-list-page';
import {ListItem, ListItemColumn, ListItemActionsMenu} from './components/ListItem';
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
import {generateFilterForServer} from './ui/components/generic-form/generate-filter-for-server';
import {assertNever, Writeable} from './helpers/typescript-helpers';
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
    getCustomEventNamePrefixed,
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

function getContentType(id): Promise<IContentProfile> {
    return dataApi.findOne('content_types', id);
}

const getContentTypeMemoized = memoize(getContentType);
let getContentTypeMemoizedLastCall: number = 0; // unix time

const isPublished = (article) => article.item_id != null;

// stores a map between custom callback & callback passed to DOM
// so the original event listener can be removed later
const customEventMap = new Map();

const addEventListener = <T extends keyof IEvents>(eventName: T, callback: (arg: IEvents[T]) => void) => {
    const handlerWrapper = (customEvent: CustomEvent) => callback(customEvent.detail);

    customEventMap.set(callback, handlerWrapper);

    window.addEventListener(getCustomEventNamePrefixed(eventName), handlerWrapper);
};

const removeEventListener = <T extends keyof IEvents>(eventName: T, callback: (arg: IEvents[T]) => void) => {
    const handlerWrapper = customEventMap.get(callback);

    if (handlerWrapper != null) {
        window.removeEventListener(getCustomEventNamePrefixed(eventName), handlerWrapper);
        customEventMap.delete(callback);
    }
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
): ISuperdesk {
    const isLocked = (article: IArticle) => article['lock_session'] != null;
    const isLockedInCurrentSession = (article: IArticle) => lock.isLockedInCurrentSession(article);
    const isLockedInOtherSession = (article: IArticle) => isLocked(article) && !isLockedInCurrentSession(article);

    return {
        dataApi: dataApi,
        dataApiByEntity,
        helpers: {
            assertNever,
        },
        entities: {
            article: {
                isPersonal: (article) => article.task == null || article.task.desk == null,
                isLocked: isLocked,
                isLockedInCurrentSession,
                isLockedInOtherSession,
                patch: (article, patch, dangerousOptions) => {
                    const onPatchBeforeMiddlewares = Object.values(extensions)
                        .map((extension) => extension.activationResult?.contributions?.entities?.article?.onPatchBefore)
                        .filter((middleware) => middleware != null);

                    onPatchBeforeMiddlewares.reduce(
                        (current, next) => current.then((result) => next(article._id, result, dangerousOptions)),
                        Promise.resolve(patch),
                    ).then((patchFinal) => {
                        return dataApi.patchRaw<IArticle>(
                            // distinction between handling published and non-published items
                            // should be removed: SDESK-4687
                            (isPublished(article) ? 'published' : 'archive'),
                            article._id,
                            article._etag,
                            patchFinal,
                        ).then((res) => {
                            if (dangerousOptions?.patchDirectlyAndOverwriteAuthoringValues === true) {
                                dispatchInternalEvent(
                                    'dangerouslyOverwriteAuthoringData',
                                    {...patch, _etag: res._etag},
                                );
                            }
                        });
                    }).catch((err) => {
                        if (err instanceof Error) {
                            logger.error(err);
                        }
                    });
                },
                isArchived: (article) => article._type === 'archived',
                isPublished: (article) => isPublished(article),
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
        },
        state: applicationState,
        instance: {
            config,
        },
        ui: {
            article: {
                view: (id: string) => {
                    ng.getService('$location').then(($location) => {
                        $location.url('/workspace/monitoring');
                        authoringWorkspace.edit({_id: id}, 'view');
                    });
                },
                addImage: (field: string, image: IArticle) => {
                    dispatchInternalEvent('addImage', {field, image});
                },
                save: () => {
                    dispatchInternalEvent('saveArticleInEditMode', null);
                },
            },
            alert: (message: string) => modal.alert({bodyText: message}),
            confirm: (message: string) => new Promise((resolve) => {
                modal.confirm(message, gettext('Cancel'))
                    .then(() => resolve(true))
                    .catch(() => resolve(false));
            }),
            showModal,
        },
        components: {
            UserHtmlSingleLine,
            getGenericListPageComponent,
            connectCrudManager,
            ListItem,
            ListItemColumn,
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
            getDropdownTree: () => DropdownTree,
            Spacer,
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
            formatDate: (date: Date) => moment(date).tz(appConfig.defaultTimezone).format(appConfig.view.dateformat),
            formatDateTime: (date: Date) => {
                return moment(date)
                    .tz(appConfig.defaultTimezone)
                    .format(appConfig.view.dateformat + ' ' + appConfig.view.timeformat);
            },
        },
        privileges: {
            getOwnPrivileges: () => privileges.loaded.then(() => privileges.privileges),
            hasPrivilege: (privilege: string) => privileges.userHasPrivileges({[privilege]: 1}),
        },
        session: {
            getToken: () => session.token,
            getCurrentUser: () => session.getIdentity(),
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
    };
}
