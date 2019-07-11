import {ISuperdesk, IExtensions, IExtensionActivationResult, IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';
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
import {assertNever} from './helpers/typescript-helpers';
import {flatMap} from 'lodash';
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
import {getCustomEventNamePrefixed} from './notification/notification';
import {Grid} from './ui/components/grid';
import {Alert} from './ui/components/alert';
import {Figure} from './ui/components/figure';
import {DropZone} from './ui/components/drop-zone';
import {GroupLabel} from './ui/components/GroupLabel';
import {TopMenuDropdownButton} from './ui/components/TopMenuDropdownButton';

function getOnUpdateBeforeMiddlewares(
    extensions: IExtensions,
): Array<IExtensionActivationResult['contributions']['entities']['article']['onUpdateBefore']> {
    return flatMap(
        Object.values(extensions).map(({activationResult}) => activationResult),
        (activationResult) =>
            activationResult.contributions != null
            && activationResult.contributions.entities != null
            && activationResult.contributions.entities.article != null
            && activationResult.contributions.entities.article.onUpdateBefore != null
                ? activationResult.contributions.entities.article.onUpdateBefore
                : [],
    );
}

function getOnUpdateAfterFunctions(
    extensions: IExtensions,
): Array<IExtensionActivationResult['contributions']['entities']['article']['onUpdateAfter']> {
    return flatMap(
        Object.values(extensions).map(({activationResult}) => activationResult),
        (activationResult) =>
            activationResult.contributions != null
            && activationResult.contributions.entities != null
            && activationResult.contributions.entities.article != null
            && activationResult.contributions.entities.article.onUpdateAfter != null
                ? activationResult.contributions.entities.article.onUpdateAfter
                : [],
    );
}

// stores a map between custom callback & callback passed to DOM
// so the original event can be removed later
const customEventMap = new Map();

export function getSuperdeskApiImplementation(
    requestingExtensionId: string,
    extensions: IExtensions,
    modal,
    privileges,
    lock,
    session,
    authoringWorkspace,
): ISuperdesk {
    return {
        dataApi: dataApi,
        dataApiByEntity,
        helpers: {
            assertNever,
        },
        entities: {
            article: {
                isPersonal: (article) => article.task == null || article.task.desk == null,
                isLocked: (article) => article['lock_session'] != null,
                isLockedByCurrentUser: (article) => lock.isLocked(article),
                update: (_articleNext) => {
                    const __articleNext = {..._articleNext};

                    // remove UI state property. It shoudln't be here in the first place,
                    // but can't be removed easily. The line below should be removed when SDESK-4343 is done.
                    delete __articleNext.selected;

                    const onUpdateBeforeMiddlewares = getOnUpdateBeforeMiddlewares(extensions);

                    onUpdateBeforeMiddlewares.reduce(
                        (current, next) => current.then((result) => next(result)),
                        Promise.resolve(__articleNext),
                    ).then((articleNext) => {
                        dataApi.findOne<IArticle>('archive', articleNext._id)
                            .then((articleCurrent) => {
                                dataApi.patch('archive', articleCurrent, articleNext).then((articleNextFromServer) => {
                                    const onUpdateAfterFunctions = getOnUpdateAfterFunctions(extensions);

                                    onUpdateAfterFunctions.forEach((fn) => {
                                        fn(articleNextFromServer);
                                    });
                                });
                            });
                    }).catch((err) => {
                        if (err instanceof Error) {
                            logger.error(err);
                        }
                    });
                },
            },
        },
        ui: {
            article: {
                view: (id: string) => {
                    authoringWorkspace.authoringOpen(id, 'view');
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
                // so it's easier to remove old versions when we have a full implementation
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
            getDropdownTree: () => DropdownTree,
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
            gettext: (message) => gettext(message),
        },
        extensions: {
            getExtension: (id: string) => {
                const extension = extensions[id].extension;

                if (extension == null) {
                    return Promise.reject('Extension not found.');
                }

                const {manifest} = extensions[requestingExtensionId];

                if (
                    manifest.superdeskExtension != null
                    && Array.isArray(manifest.superdeskExtension.dependencies)
                    && manifest.superdeskExtension.dependencies.includes(id)
                ) {
                    const extensionShallowCopy = {...extension};

                    delete extensionShallowCopy['activate'];

                    return Promise.resolve(extensionShallowCopy);
                } else {
                    return Promise.reject('Not authorized.');
                }
            },
        },
        privileges: {
            getOwnPrivileges: () => privileges.loaded.then(() => privileges.privileges),
        },
        session: {
            getCurrentUser: () => session.getIdentity(),
        },
        utilities: {
            logger,
            CSS: {
                getClass: (originalName: string) => getCssNameForExtension(originalName, requestingExtensionId),
                getId: (originalName: string) => getCssNameForExtension(originalName, requestingExtensionId),
            },
        },
        addEventListener: (eventName, callback) => {
            const handlerWrapper = (customEvent: CustomEvent) => callback(customEvent.detail);

            customEventMap.set(callback, handlerWrapper);

            window.addEventListener(getCustomEventNamePrefixed(eventName), handlerWrapper);
        },
        removeEventListener: (eventName, callback) => {
            const handlerWrapper = customEventMap.get(callback);

            if (handlerWrapper != null) {
                window.removeEventListener(getCustomEventNamePrefixed(eventName), handlerWrapper);
                customEventMap.delete(callback);
            }
        },
    };
}
