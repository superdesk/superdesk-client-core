import {showOptionsModal} from './options-modal';
import {gettext} from 'core/utils';

export enum IUnsavedChangesAction {
    discardChanges = 'discardChanges',
    openItem = 'openItem',
    cancelAction = 'cancelAction',
}

interface IResult {
    action: IUnsavedChangesAction;
    closePromptFn: () => void;
}

export function showUnsavedChangesPrompt(): Promise<IResult> {
    return new Promise((resolve) => {
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
        );
    });
}
