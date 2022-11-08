import {isEqual} from 'lodash';
import {rundownItemContentProfile} from './rundown-items/content-profile';
import {
    IAuthoringAutoSave,
    IAuthoringStorage,
    IPatchResponseExtraFields,
} from 'superdesk-api';
import {IRundown, IRundownItem} from '../../interfaces';
import {superdesk} from '../../superdesk';
import {IWithAuthoringReactKey} from './template-edit';
import {prepareRundownItemForSaving} from './rundown-view-edit';

const {tryLocking, fixPatchResponse, fixPatchRequest} = superdesk.helpers;
const {generatePatch} = superdesk.utilities;
const {httpRequestJsonLocal} = superdesk;

interface ICreate extends IWithAuthoringReactKey {
    type: 'create';
    rundownId: IRundown['_id'];
    initialData: Partial<IRundownItem>;
    authoringStorage: IAuthoringStorage<IRundownItem>;
}

interface IEdit extends IWithAuthoringReactKey {
    type: 'edit';
    itemId: IRundownItem['_id'];
    authoringStorage: IAuthoringStorage<IRundownItem>;
}

interface IPreview extends IWithAuthoringReactKey {
    type: 'preview';
    itemId: IRundownItem['_id'];
    authoringStorage: IAuthoringStorage<IRundownItem>;
}

export type IRundownItemActionNext = ICreate | IEdit | IPreview | null;

function getRundownItemAuthoringStorage(id: IRundownItem['_id']): IAuthoringStorage<IRundownItem> {
    class AutoSaveRundownItem implements IAuthoringAutoSave<IRundownItem> {
        get() {
            return httpRequestJsonLocal<IRundownItem>({
                method: 'GET',
                path: `/rundown_items/${id}`,
            });
        }

        delete() {
            return Promise.resolve();
        }

        schedule(
            getItem: () => IRundownItem,
            callback: (autosaved: IRundownItem) => void,
        ) {
            callback(getItem());
        }

        cancel() {
            // noop
        }
    }

    const authoringStorageRundownItem: IAuthoringStorage<IRundownItem> = {
        autosave: new AutoSaveRundownItem(),
        getEntity: () => {
            return httpRequestJsonLocal<IRundownItem>({
                method: 'GET',
                path: `/rundown_items/${id}`,
            }).then((saved) => ({saved, autosaved: null}));
        },
        isLockedInCurrentSession: () => false,
        forceLock: (entity) => {
            return tryLocking<IRundownItem>('/rundown_items', entity._id, true)

                // force-unlock can't fail
                .then((res) => res.success ? res.latestEntity : entity);
        },
        saveEntity: (current, original) => {
            const patch: Partial<IRundownItem> = {
                ...fixPatchRequest(
                    prepareRundownItemForSaving(
                        generatePatch(original, current, {undefinedEqNull: true}),
                    ),
                ),
                fields_meta: current.fields_meta ?? {}, // maintain fields_meta; attempting to patch would drop fields
            };

            return httpRequestJsonLocal<IRundownItem & IPatchResponseExtraFields>({
                method: 'PATCH',
                path: `/rundown_items/${id}`,
                payload: patch,
                headers: {
                    'If-Match': original._etag,
                },
            }).then((patchRes) => fixPatchResponse(patchRes));
        },
        getContentProfile: () => {
            return Promise.resolve(rundownItemContentProfile);
        },
        closeAuthoring: (current, original, _cancelAutosave, doClose) => {
            const warnAboutLosingChanges = !isEqual(current, original);

            if (warnAboutLosingChanges) {
                return superdesk.ui.confirm('Discard unsaved changes?').then((confirmed) => {
                    if (confirmed) {
                        doClose();
                    }
                });
            } else {
                doClose();
            }

            return Promise.resolve();
        },
        getUserPreferences: () => Promise.resolve({'spellchecker:status': {enabled: true}}), // FINISH: remove test data
    };

    return authoringStorageRundownItem;
}

function getRundownItemCreationAuthoringStorage(
    rundownId: IRundown['_id'],
    initialData: Partial<IRundownItem>,
    onSave: (item: IRundownItem) => Promise<IRundownItem>,
): IAuthoringStorage<IRundownItem> {
    class AutoSaveRundownItem implements IAuthoringAutoSave<IRundownItem> {
        get() {
            return Promise.resolve(initialData as IRundownItem);
        }

        delete() {
            return Promise.resolve();
        }

        schedule(
            getItem: () => IRundownItem,
            callback: (autosaved: IRundownItem) => void,
        ) {
            callback(getItem());
        }

        cancel() {
            // noop
        }
    }

    const contentProfile = rundownItemContentProfile;

    const authoringStorageRundownItem: IAuthoringStorage<IRundownItem> = {
        autosave: new AutoSaveRundownItem(),
        getEntity: () => {
            return Promise.resolve({saved: initialData as IRundownItem, autosaved: null});
        },
        isLockedInCurrentSession: () => true,
        forceLock: (entity) => {
            return Promise.resolve(entity);
        },
        saveEntity: (current) => {
            const allFields = contentProfile.header.merge(contentProfile.content);
            const readOnlyFields = allFields.filter((field) => field.fieldConfig.readOnly === true);

            const itemToSave: IRundownItem = {
                ...current,
                rundown: rundownId, // read-only, but needs to be sent when creating an item
            };

            readOnlyFields.forEach((field) => {
                /**
                 * Remove read-only fields to avoid getting an error from the server.
                 * Since it's read-only it would contain an empty value anyway.
                 */
                delete (itemToSave as {[key: string]: any})[field.id];
            });

            return onSave(itemToSave);
        },
        getContentProfile: () => {
            return Promise.resolve(contentProfile);
        },
        closeAuthoring: (_current, _original, _cancelAutosave, doClose) => {
            return superdesk.ui.confirm('Discard unsaved changes?').then((confirmed) => {
                if (confirmed) {
                    doClose();
                }
            });
        },
        getUserPreferences: () => Promise.resolve({'spellchecker:status': {enabled: true}}), // FINISH: remove test data
    };

    return authoringStorageRundownItem;
}

export function prepareForCreation(
    rundownId: string,
    currentAction: IRundownItemActionNext,
    initialValue: Partial<IRundownItem>,
    onSave: (item: IRundownItem) => Promise<IRundownItem>,
): ICreate {
    return {
        type: 'create',
        rundownId,
        initialData: initialValue,
        authoringStorage: getRundownItemCreationAuthoringStorage(
            rundownId,
            initialValue,
            onSave,
        ),
        authoringReactKey: currentAction == null ? 0 : currentAction.authoringReactKey + 1,
    };
}

export function prepareForEditing(
    currentAction: IRundownItemActionNext,
    id: IRundownItem['_id'],
): IEdit {
    return {
        type: 'edit',
        itemId: id,
        authoringStorage: getRundownItemAuthoringStorage(id),
        authoringReactKey: currentAction == null ? 0 : currentAction.authoringReactKey + 1,
    };
}

export function prepareForPreview(
    currentAction: IRundownItemActionNext,
    id: IRundownItem['_id'],
): IPreview {
    return {
        type: 'preview',
        itemId: id,
        authoringStorage: getRundownItemAuthoringStorage(id),
        authoringReactKey: currentAction == null ? 0 : currentAction.authoringReactKey + 1,
    };
}
