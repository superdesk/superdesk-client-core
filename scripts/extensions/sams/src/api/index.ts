// Types
import {ISuperdesk} from 'superdesk-api';
import {ISamsAPI, ISetItem, IStorageDestinationItem} from '../interfaces';

// APIs
import {getAllSets, createSet, updateSet, deleteSet} from './sets';
import {getAllStorageDestinations} from './storageDestinations';
import {uploadAsset, getAssetsCount} from './assets';

export function getSamsAPIs(superdesk: ISuperdesk): ISamsAPI {
    return {
        sets: {
            getAll(): Promise<Array<ISetItem>> {
                return getAllSets(superdesk);
            },
            create(set: Partial<ISetItem>): Promise<ISetItem> {
                return createSet(superdesk, set);
            },
            update(original: ISetItem, updates: Partial<ISetItem>): Promise<ISetItem> {
                return updateSet(superdesk, original, updates);
            },
            delete(set: ISetItem): Promise<void> {
                return deleteSet(superdesk, set);
            },
        },
        storageDestinations: {
            getAll(): Promise<Array<IStorageDestinationItem>> {
                return getAllStorageDestinations(superdesk);
            },
        },
        assets: {
            upload(data: FormData, onProgress: (event: ProgressEvent) => void): Promise<any> {
                return uploadAsset(superdesk, data, onProgress);
            },
            getCount(set_ids: string[]): Promise<Dictionary<string, number>> {
                return getAssetsCount(superdesk, set_ids);
            }
        },
    };
}
