/**
 * This file is part of Superdesk.
 *
 * Copyright 2015 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import {showUnsavedChangesPrompt, IUnsavedChangesActionWithSaving} from 'core/ui/components/prompt-for-unsaved-changes';
import {gettext} from 'core/utils';
import {notify} from 'core/notify/notify';

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
