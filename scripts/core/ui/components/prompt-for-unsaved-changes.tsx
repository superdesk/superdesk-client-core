/* eslint-disable no-redeclare */

import {showOptionsModal} from './options-modal';
import {gettext} from 'core/utils';
import {notify} from 'core/notify/notify';

export enum IUnsavedChangesAction {
    discardChanges = 'discardChanges',
    openItem = 'openItem',
    cancelAction = 'cancelAction',
}

export enum IUnsavedChangesActionWithSaving {
    discardChanges = 'discardChanges',
    save = 'save',
    cancelAction = 'cancelAction',
}

interface IResult<T> {
    action: T;
    closePromptFn: () => void;
}

// overloads
export function showUnsavedChangesPrompt(itemOpen: true): Promise<IResult<IUnsavedChangesActionWithSaving>>;
export function showUnsavedChangesPrompt(): Promise<IResult<IUnsavedChangesAction>>;

export function showUnsavedChangesPrompt(
    itemOpen?: boolean, // if not open, instead of option to save item, it will show an option to open it first
) {
    return new Promise((resolve) => {
        if (itemOpen === true) {
            showOptionsModal(
                gettext('Save changes?'),
                gettext('There are some unsaved changes, save it now?'),
                [
                    {
                        label: gettext('Ignore'),
                        onSelect: (closePromptFn) => {
                            resolve({
                                action: IUnsavedChangesActionWithSaving.discardChanges,
                                closePromptFn,
                            });
                        },
                    },
                    {
                        label: gettext('Cancel'),
                        onSelect: (closePromptFn) => {
                            resolve({
                                action: IUnsavedChangesActionWithSaving.cancelAction,
                                closePromptFn,
                            });
                        },
                    },
                    {
                        label: gettext('Save'),
                        onSelect: (closePromptFn) => {
                            resolve({
                                action: IUnsavedChangesActionWithSaving.save,
                                closePromptFn,
                            });
                        },
                        highlightOption: true,
                    },
                ],
                'unsaved-changes-dialog',
            );
        } else {
            showOptionsModal(
                gettext('Save changes?'),
                gettext('There are some unsaved changes, go to the article to save changes?'),
                [
                    {
                        label: gettext('Ignore'),
                        onSelect: (closePromptFn) => {
                            resolve({
                                action: IUnsavedChangesAction.discardChanges,
                                closePromptFn,
                            });
                        },
                    },
                    {
                        label: gettext('Cancel'),
                        onSelect: (closePromptFn) => {
                            resolve({
                                action: IUnsavedChangesAction.cancelAction,
                                closePromptFn,
                            });
                        },
                    },
                    {
                        label: gettext('Go-To'),
                        onSelect: (closePromptFn) => {
                            resolve({
                                action: IUnsavedChangesAction.openItem,
                                closePromptFn,
                            });
                        },
                        highlightOption: true,
                    },
                ],
                'unsaved-changes-dialog',
            );
        }
    });
}

/**
 * Unified handler for checking unsaved changes in multi-edit
 * used by both angular and react paths
 */
export function handleMultiItemUnsavedChanges<T>(
    items: Array<T>,
    options: {
        hasUnsavedChanges: (item: T) => boolean | Promise<boolean>;
        discardChanges: (item: T) => Promise<void>;
        save: (item: T) => Promise<void>;
        onExit: () => void;
        onError?: (error: any) => void;
    },
): Promise<void> {
    const checkPromises = items.map((item) => {
        const result = options.hasUnsavedChanges(item);

        return result instanceof Promise ? result : Promise.resolve(result);
    });

    return Promise.all(checkPromises).then((results) => {
        const hasAnyChanges = results.some((result) => result === true);

        if (!hasAnyChanges) {
            options.onExit();
            return;
        }

        return showUnsavedChangesPrompt(true).then(({action, closePromptFn}) => {
            if (action === IUnsavedChangesActionWithSaving.cancelAction) {
                closePromptFn();
                return;
            }

            const finalizeExit = () => {
                closePromptFn();
                options.onExit();
            };

            if (action === IUnsavedChangesActionWithSaving.discardChanges) {
                const discardPromises = items.map((item) => options.discardChanges(item));

                return Promise.all(discardPromises)
                    .then(finalizeExit)
                    .catch((error) => {
                        notify.error(gettext('Failed to discard some changes'));
                        options.onError?.(error);
                        finalizeExit();
                    });
            }

            if (action === IUnsavedChangesActionWithSaving.save) {
                const savePromises = items.map((item) => options.save(item));

                return Promise.all(savePromises)
                    .then(finalizeExit)
                    .catch((error) => {
                        notify.error(gettext('Failed to save some articles'));
                        options.onError?.(error);
                    });
            }
        });
    }).catch((error) => {
        notify.error(gettext('Failed to check for unsaved changes'));
        options.onError?.(error);
    });
}
