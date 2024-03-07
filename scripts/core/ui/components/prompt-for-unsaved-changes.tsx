/* eslint-disable no-redeclare */

import {showOptionsModal} from './options-modal';
import {gettext} from 'core/utils';

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
                'options-modal'
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
                'options-modal'
            );
        }
    });
}
