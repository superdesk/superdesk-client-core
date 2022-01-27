import {IArticle} from 'superdesk-api';
import {showUnsavedChangesPrompt, IUnsavedChangesActionWithSaving} from 'core/ui/components/prompt-for-unsaved-changes';
import {assertNever} from 'core/helpers/typescript-helpers';
import {ITEM_STATE} from 'apps/archive/constants';
import {isLockedInCurrentSession} from 'core/get-superdesk-api-implementation';
import ng from 'core/services/ng';
import {runBeforeUpdateMiddlware, runAfterUpdateEvent} from 'apps/authoring/authoring/services/authoring-helpers';

export interface IAuthoringApiCommon {
    saveBefore(current: IArticle, original: IArticle): Promise<IArticle>;
    saveAfter(current: IArticle, original: IArticle): void;
    closeAuthoring(
        original: IArticle,
        hasUnsavedChanges: boolean,
        save: () => Promise<void>,
        unlock: () => Promise<void>,
        cancelAutoSave: () => Promise<void>,
        doClose: () => void,
    ): Promise<void>;

    /**
     * Is only meant to be used when there are no unsaved changes
     * and item is not locked.
     */
    closeAuthoringForce(): void;
}

/**
 * Immutable API that is used in both - angularjs and reactjs based authoring code.
 */
export const authoringApiCommon: IAuthoringApiCommon = {
    saveBefore: (current, original) => {
        return runBeforeUpdateMiddlware(current, original);
    },
    saveAfter: (current, original) => {
        runAfterUpdateEvent(original, current);
    },
    closeAuthoring: (original: IArticle, hasUnsavedChanges, save, unlock, cancelAutoSave, doClose) => {
        if (!isLockedInCurrentSession(original)) {
            return Promise.resolve().then(() => doClose());
        }

        if (hasUnsavedChanges && (original.state !== ITEM_STATE.PUBLISHED && original.state !== ITEM_STATE.CORRECTED)) {
            return showUnsavedChangesPrompt(hasUnsavedChanges).then(({action, closePromptFn}) => {
                const unlockAndClose = () => unlock().then(() => {
                    closePromptFn();
                    doClose();
                });

                if (action === IUnsavedChangesActionWithSaving.cancelAction) {
                    return closePromptFn();
                } else if (action === IUnsavedChangesActionWithSaving.discardChanges) {
                    return cancelAutoSave().then(() => unlockAndClose());
                } else if (action === IUnsavedChangesActionWithSaving.save) {
                    return save().then(() => unlockAndClose());
                } else {
                    assertNever(action);
                }
            });
        } else {
            return unlock().then(() => doClose());
        }
    },
    closeAuthoringForce: () => {
        ng.get('authoringWorkspace').close();
    },
};
