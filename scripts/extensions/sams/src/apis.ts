import {ISuperdesk} from 'superdesk-api';
import {ISamsAPI} from './interfaces';

import {getAllSets, createSet, updateSet, deleteSet} from './api/sets';
import {getAllStorageDestinations} from './api/storageDestinations';
import {
    uploadAsset,
    getAssetsCount,
    queryAssets,
    getAssetSearchUrlParams,
    setAssetSearchUrlParams,
    getAssetById,
    updateAssetMetadata,
    showUploadAssetModal,
} from './api/assets';

// will be set asynchronously on SAMS extension start
// members can't be accessed in root module scope synchronously

export const superdeskApi = {} as ISuperdesk;

export const samsApi: ISamsAPI = {
    sets: {
        getAll: getAllSets,
        create: createSet,
        update: updateSet,
        delete: deleteSet,
    },
    storageDestinations: {
        getAll: getAllStorageDestinations,
    },
    assets: {
        upload: uploadAsset,
        query: queryAssets,
        getSearchUrlParams: getAssetSearchUrlParams,
        setSearchUrlParams: setAssetSearchUrlParams,
        getCount: getAssetsCount,
        getById: getAssetById,
        updateMetadata: updateAssetMetadata,
        showUploadModal: showUploadAssetModal,
    },
};
