
import {rundownItemContentProfile} from './rundown-items/content-profile';
import {
    IAuthoringAutoSave,
    IAuthoringStorage,
} from 'superdesk-api';
import {IRundownItemBase, IRundownItemTemplateInitial} from '../../interfaces';
import {ICreate, IEdit} from './template-edit';

function getRundownItemTemplateAuthoringStorage(
    item: IRundownItemTemplateInitial,
    onSave: (item: IRundownItemTemplateInitial) => void,
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
        lock: () => {
            return Promise.resolve(item);
        },
        unlock: () => {
            return Promise.resolve(item);
        },
        saveEntity: (current) => {
            onSave(current);

            return Promise.resolve(current);
        },
        getContentProfile: () => {
            return Promise.resolve(rundownItemContentProfile);
        },
        closeAuthoring: (_1, _2, _3, doClose) => {
            doClose();
            return Promise.resolve();
        },
        getUserPreferences: () => Promise.resolve({'spellchecker:status': {enabled: true}}), // FINISH: remove test data
    };

    return authoringStorageRundownItem;
}

export function prepareForCreation(
    onSave: (item: IRundownItemTemplateInitial) => void,
): ICreate {
    const item: IRundownItemTemplateInitial = {
        _id: '',
        _created: '',
        _updated: '',
        _etag: '',
        _links: {},
        data: {},
    };

    return {
        type: 'create',
        item: item,
        authoringStorage: getRundownItemTemplateAuthoringStorage(
            item,
            onSave,
        ),
    };
}

export function prepareForEditing(
    data: IRundownItemBase,
    onSave: (item: IRundownItemBase) => void,
): IEdit {
    const item: IRundownItemTemplateInitial = {
        _id: '',
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
            ),
        ),
    };
}
