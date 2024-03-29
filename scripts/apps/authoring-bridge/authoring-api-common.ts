import {ITEM_STATE} from 'apps/archive/constants';
import {runAfterUpdateEvent, runBeforeUpdateMiddlware} from 'apps/authoring/authoring/services/authoring-helpers';
import {isArticleLockedInCurrentSession} from 'core/get-superdesk-api-implementation';
import {assertNever} from 'core/helpers/typescript-helpers';
import ng from 'core/services/ng';
import {IUnsavedChangesActionWithSaving, showUnsavedChangesPrompt} from 'core/ui/components/prompt-for-unsaved-changes';
import {IArticle} from 'superdesk-api';
import {appConfig} from 'appConfig';

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

    /**
     * We need to keep the steps separate because it needs to be called
     * separately in Angular. When we remove Angular the closeAuthoring
     * and closeAuthoringStep2 will be merged together.
     */
    closeAuthoringStep2(scope: any, rootScope: any): Promise<any>;
    checkShortcutButtonAvailability: (item: IArticle, dirty?: boolean, personal?: boolean) => boolean;
}

/**
 * Immutable API that is used in both - angularjs and reactjs based authoring code.
 */
export const authoringApiCommon: IAuthoringApiCommon = {
    checkShortcutButtonAvailability: (item: IArticle, dirty?: boolean, personal?: boolean): boolean => {
        if (personal) {
            return appConfig?.features?.publishFromPersonal && item.state !== 'draft';
        }

        return item.task && item.task.desk && item.state !== 'draft' || dirty;
    },
    saveBefore: (current, original) => {
        return runBeforeUpdateMiddlware(current, original);
    },
    saveAfter: (current, original) => {
        runAfterUpdateEvent(original, current);
    },
    closeAuthoringStep2: (scope: any, rootScope: any): Promise<any> => {
        return ng.get('authoring').close(
            scope.item,
            scope.origItem,
            scope.save_enabled(),
            () => {
                ng.get('authoringWorkspace').close(true);
                const itemId = scope.origItem._id;
                const storedItemId = localStorage.getItem(`open-item-after-related-closed--${itemId}`);

                rootScope.$broadcast('item:close', itemId);

                /**
                 * If related item was just created and saved, open the original item
                 * that triggered the creation of this related item.
                 */
                if (storedItemId != null) {
                    return ng.get('autosave').get({_id: storedItemId}).then((resulted) => {
                        ng.get('authoringWorkspace').open(resulted);
                        localStorage.removeItem(`open-item-after-related-closed--${itemId}`);
                    });
                }
            },
        );
    },
    closeAuthoring: (original: IArticle, hasUnsavedChanges, save, unlock, cancelAutoSave, doClose) => {
        if (!isArticleLockedInCurrentSession(original)) {
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
        ng.get('superdeskFlags').flags.hideMonitoring = false;

        ng.get('authoringWorkspace').close();
    },
};
