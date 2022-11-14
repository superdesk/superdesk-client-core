import {isEqual} from 'lodash';
import {rundownItemContentProfile} from './rundown-items/content-profile';
import {
    IAuthoringAutoSave,
    IAuthoringStorage,
} from 'superdesk-api';
import {IRundownItemBase, IRundownItemTemplateInitial} from '../../interfaces';
import {ICreate, IEdit, IPreview, IRundownItemAction} from './template-edit';
import {superdesk} from '../../superdesk';

function getRundownItemTemplateAuthoringStorage(
    item: IRundownItemTemplateInitial,
    onSave: (item: IRundownItemTemplateInitial) => Promise<IRundownItemTemplateInitial>,
): IAuthoringStorage<IRundownItemTemplateInitial> {
    class AutoSaveRundownItem implements IAuthoringAutoSave<IRundownItemTemplateInitial> {
        get() {
            return Promise.resolve(item);
        }

        delete() {
            return Promise.resolve();
        }

        schedule(
            getItem: () => IRundownItemTemplateInitial,
            callback: (autosaved: IRundownItemTemplateInitial) => void,
        ) {
            callback(getItem());
        }

        cancel() {
            // noop
        }
    }

    const authoringStorageRundownItem: IAuthoringStorage<IRundownItemTemplateInitial> = {
        autosave: new AutoSaveRundownItem(),
        getEntity: () => {
            return Promise.resolve({saved: item, autosaved: null});
        },
        isLockedInCurrentSession: () => false,

        /**
         * Locking is not supported for embedded items that don't have _id's
         */
        forceLock: (entity) => {
            return Promise.resolve(entity);
        },
        saveEntity: (current) => {
            return onSave(current);
        },
        getContentProfile: () => {
            return Promise.resolve(rundownItemContentProfile);
        },
        closeAuthoring: (current, original, _cancelAutosave, doClose) => {
            const isCreationMode = Object.keys(original.data).length < 1;
            const warnAboutLosingChanges = isCreationMode || !isEqual(current.data, original.data);

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

export function prepareForCreation(
    currentAction: IRundownItemAction,
    initialValue: Partial<IRundownItemBase>,
    onSave: (item: IRundownItemTemplateInitial) => Promise<IRundownItemTemplateInitial>,
): ICreate {
    const item: IRundownItemTemplateInitial = {
        _id: '',
        _created: '',
        _updated: '',
        _etag: '',
        _links: {},
        data: initialValue,
    };

    return {
        type: 'create',
        item: item,
        authoringStorage: getRundownItemTemplateAuthoringStorage(
            item,
            onSave,
        ),
        authoringReactKey: currentAction == null ? 0 : currentAction.authoringReactKey + 1,
    };
}

export function prepareForEditing(
    currentAction: IRundownItemAction,
    id: string | null,
    data: IRundownItemBase,
    onSave: (item: IRundownItemBase) => Promise<IRundownItemBase>,
): IEdit {
    const item: IRundownItemTemplateInitial = {
        _id: id ?? '',
        _created: '',
        _updated: '',
        _etag: '',
        _links: {},
        data,
    };

    return {
        type: 'edit',
        item: item,
        authoringStorage: getRundownItemTemplateAuthoringStorage(
            item,
            (res) => onSave(
                res.data as IRundownItemBase, // validated by the authoring component
            ).then((dataSaved) => {
                const saved: IRundownItemTemplateInitial = {
                    _id: '',
                    _created: '',
                    _updated: '',
                    _etag: '',
                    _links: {},
                    data: dataSaved,
                };

                return saved;
            }),
        ),
        authoringReactKey: currentAction == null ? 0 : currentAction.authoringReactKey + 1,
    };
}

export function prepareForPreview(
    currentAction: IRundownItemAction,
    id: string | null,
    data: IRundownItemBase,
): IPreview {
    const item: IRundownItemTemplateInitial = {
        _id: id ?? '',
        _created: '',
        _updated: '',
        _etag: '',
        _links: {},
        data,
    };

    return {
        type: 'preview',
        item: item,
        authoringStorage: getRundownItemTemplateAuthoringStorage(
            item,
            (_) => Promise.resolve(_),
        ),
        authoringReactKey: currentAction == null ? 0 : currentAction.authoringReactKey + 1,
    };
}
