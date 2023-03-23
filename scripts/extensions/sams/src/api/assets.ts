// Types
import {
    IAttachment,
    IElasticRangeQueryParams,
    IRestApiResponse,
    IRootElasticQuery,
} from 'superdesk-api';
import {
    ASSET_LIST_STYLE,
    ASSET_SORT_FIELD,
    ASSET_STATE,
    ASSET_TYPE_FILTER,
    IAssetItem,
    IAssetSearchParams,
    SORT_ORDER,
    IUploadAssetModalProps,
    ISetItem,
    SET_STATE,
    IAutoTaggingSearchResult,
} from '../interfaces';
import {superdeskApi} from '../apis';

// Redux Actions & Selectors
import {getStoreSync} from '../store';
import {loadSets} from '../store/sets/actions';
import {getSetsById, getAvailableSetsForDesk} from '../store/sets/selectors';

// Utils
import {fixItemResponseVersionDates, fixItemVersionDates} from './common';
import {getApiErrorMessage, isSamsApiError} from '../utils/api';

// UI
import {showModalConnectedToStore} from '../utils/ui';
import {UploadAssetModal} from '../components/assets/uploadAssetModal';

const RESOURCE = 'sams/assets';
const COUNT_RESOURCE = `${RESOURCE}/counts/`;
const BINARY_RESOURCE = `${RESOURCE}/binary/`;
const COMPRESSED_BINARY_RESOURCE = `${RESOURCE}/compressed_binary/`;
const LOCK_ASSET = `${RESOURCE}/lock`;
const UNLOCK_ASSET = `${RESOURCE}/unlock`;

export function uploadAsset(
    data: FormData,
    onProgress: (event: ProgressEvent) => void,
): Promise<IAssetItem> {
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;

    return superdeskApi.dataApi.uploadFileWithProgress<IAssetItem>(
        '/' + RESOURCE,
        data,
        onProgress,
    )
        .catch((error: any) => {
            if (isSamsApiError(error)) {
                notify.error(getApiErrorMessage(error));
            } else {
                notify.error(gettext('Failed to upload file.'));
            }

            return Promise.reject(error);
        });
}

const GRID_PAGE_SIZE = 25;
const LIST_PAGE_SIZE = 50;

function querySearchString(source: IRootElasticQuery, params: IAssetSearchParams) {
    if (params.textSearch != null && params.textSearch.length > 0) {
        source.query.bool.must.push(
            superdeskApi.elasticsearch.queryString({
                query: params.textSearch,
                lenient: true,
                default_operator: 'AND',
            }),
        );
    }
}

function querySetId(source: IRootElasticQuery, params: IAssetSearchParams) {
    if (params.setId != null && params.setId.length > 0) {
        source.query.bool.must.push(
            superdeskApi.elasticsearch.term({
                field: 'set_id',
                value: params.setId,
            }),
        );
    }
}

function querySetIds(source: IRootElasticQuery, params: IAssetSearchParams) {
    if (params.setIds != null && params.setIds.length > 0) {
        source.query.bool.must.push(
            superdeskApi.elasticsearch.terms({
                field: 'set_id',
                value: params.setIds,
            }),
        );
    }
}

function queryAllAvailableSets(source: IRootElasticQuery, params: IAssetSearchParams) {
    if (!params.setId?.length && !params.setIds?.length) {
        // Construct the list of Set IDs to use (based on the currently selected Desk)
        const store = getStoreSync();
        const setIds = getAvailableSetsForDesk(store.getState());

        source.query.bool.must.push(
            superdeskApi.elasticsearch.terms({
                field: 'set_id',
                value: setIds,
            }),
        );
    }
}

function queryExcludedAssetIds(source: IRootElasticQuery, params: IAssetSearchParams) {
    if (params.excludedAssetIds != null && params.excludedAssetIds.length > 0) {
        source.query.bool.must_not.push(
            superdeskApi.elasticsearch.terms({
                field: '_id',
                value: params.excludedAssetIds,
            }),
        );
    }
}

function queryState(source: IRootElasticQuery, params: IAssetSearchParams) {
    if (params.state != null && params.state.length > 0) {
        source.query.bool.must.push(
            superdeskApi.elasticsearch.term({
                field: 'state',
                value: params.state,
            }),
        );
    }
}

function queryStates(source: IRootElasticQuery, params: IAssetSearchParams) {
    if (params.states != null && params.states.length > 0) {
        source.query.bool.must.push(
            superdeskApi.elasticsearch.terms({
                field: 'state',
                value: params.states,
            }),
        );
    }
}

function queryName(source: IRootElasticQuery, params: IAssetSearchParams) {
    if (params.name != null && params.name.length > 0) {
        source.query.bool.must.push(
            superdeskApi.elasticsearch.queryString({
                query: `name:(${params.name})`,
                lenient: true,
                default_operator: 'AND',
            }),
        );
    }
}

function queryFilename(source: IRootElasticQuery, params: IAssetSearchParams) {
    if (params.filename != null && params.filename.length > 0) {
        source.query.bool.must.push(
            superdeskApi.elasticsearch.queryString({
                query: `filename:(${params.filename})`,
                lenient: true,
                default_operator: 'AND',
            }),
        );
    }
}

function queryDescription(source: IRootElasticQuery, params: IAssetSearchParams) {
    if (params.description != null && params.description.length > 0) {
        source.query.bool.must.push(
            superdeskApi.elasticsearch.queryString({
                query: `description:(${params.description})`,
                lenient: false,
                default_operator: 'AND',
            }),
        );
    }
}

function queryTags(source: IRootElasticQuery, params: IAssetSearchParams) {
    if (params.tags != null && params.tags.length > 0) {
        let taglist: Array<string> = [];

        params.tags.forEach((tag) => {
            taglist.push(tag.code);
        });
        source.query.bool.must.push(
            superdeskApi.elasticsearch.terms({
                field: 'tags.code',
                value: taglist,
            }),
        );
    }
}

function queryMimetypes(source: IRootElasticQuery, params: IAssetSearchParams) {
    if (params.mimetypes === ASSET_TYPE_FILTER.DOCUMENTS) {
        source.query.bool.must_not.push(
            superdeskApi.elasticsearch.queryString({
                query: 'mimetype:(image\\/*) OR mimetype:(video\\/*) OR mimetype:(audio\\/*)',
                lenient: true,
                default_operator: 'OR',
            }),
        );
    } else if (params.mimetypes !== ASSET_TYPE_FILTER.ALL) {
        let typeString: string;

        switch (params.mimetypes) {
        case ASSET_TYPE_FILTER.IMAGES:
            typeString = 'image';
            break;
        case ASSET_TYPE_FILTER.VIDEOS:
            typeString = 'video';
            break;
        case ASSET_TYPE_FILTER.AUDIO:
            typeString = 'audio';
            break;
        }

        if (typeString != null) {
            source.query.bool.must.push(
                superdeskApi.elasticsearch.queryString({
                    query: `mimetype:(${typeString}\\/*)`,
                    lenient: true,
                    default_operator: 'OR',
                }),
            );
        }
    }
}

function queryDateRange(source: IRootElasticQuery, params: IAssetSearchParams) {
    if (params.dateFrom != null || params.dateTo != null) {
        const args: IElasticRangeQueryParams = {field: '_updated'};

        if (params.dateFrom != null) {
            args.gte = params.dateFrom.toISOString();
        }

        if (params.dateTo != null) {
            args.lte = params.dateTo.toISOString();
        }

        source.query.bool.must.push(
            superdeskApi.elasticsearch.range(args),
        );
    }
}

function querySizeRange(source: IRootElasticQuery, params: IAssetSearchParams) {
    if (params.sizeFrom != null || params.sizeTo != null) {
        const args: IElasticRangeQueryParams = {field: 'length'};

        if (params.sizeFrom != null) {
            args.gte = params.sizeFrom * 1048576; // MB -> bytes
        }

        if (params.sizeTo != null) {
            args.lte = params.sizeTo * 1048576; // MB -> bytes
        }

        source.query.bool.must.push(
            superdeskApi.elasticsearch.range(args),
        );
    }
}

export function queryAssets(
    params: IAssetSearchParams,
    listStyle: ASSET_LIST_STYLE,
): Promise<IRestApiResponse<IAssetItem>> {
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;
    const pageSize = listStyle === ASSET_LIST_STYLE.GRID ?
        GRID_PAGE_SIZE :
        LIST_PAGE_SIZE;

    const source: IRootElasticQuery = {
        query: {
            bool: {
                must: [],
                must_not: [],
            },
        },
        size: pageSize,
        from: (params.page - 1) * pageSize,
    };

    [
        querySearchString,
        querySetId,
        querySetIds,
        queryAllAvailableSets,
        queryExcludedAssetIds,
        queryName,
        queryDescription,
        queryTags,
        queryFilename,
        queryMimetypes,
        queryState,
        queryStates,
        queryDateRange,
        querySizeRange,
    ].forEach((func) => func(source, params));

    const sortOrder = params.sortOrder === SORT_ORDER.ASCENDING ? 1 : 0;
    const sort = `[("${params.sortField}",${sortOrder})]`;

    return superdeskApi.dataApi.queryRawJson<IRestApiResponse<IAssetItem>>(
        RESOURCE,
        {
            source: JSON.stringify(source),
            sort: sort,
        },
    )
        .then(fixItemResponseVersionDates)
        .catch((error: any) => {
            if (isSamsApiError(error)) {
                notify.error(getApiErrorMessage(error));
            } else {
                notify.error(gettext('Failed to query Assets'));
            }

            return Promise.reject(error);
        });
}

export function getAssetSearchUrlParams(): Partial<IAssetSearchParams> {
    const {urlParams} = superdeskApi.browser.location;
    const {filterUndefined} = superdeskApi.helpers;

    return filterUndefined<IAssetSearchParams>({
        textSearch: urlParams.getString('textSearch'),
        setId: urlParams.getString('setId'),
        name: urlParams.getString('name'),
        description: urlParams.getString('description'),
        tags: urlParams.getStringArray('tags')?.map((tag) => ({'code': tag, 'name': tag})),
        state: urlParams.getString('state') as ASSET_STATE,
        filename: urlParams.getString('filename'),
        mimetypes: urlParams.getString('mimetypes', ASSET_TYPE_FILTER.ALL) as ASSET_TYPE_FILTER,
        dateFrom: urlParams.getDate('dateFrom'),
        dateTo: urlParams.getDate('dateTo'),
        sizeFrom: urlParams.getNumber('sizeFrom'),
        sizeTo: urlParams.getNumber('sizeTo'),
        sortField: urlParams.getString('sortField', ASSET_SORT_FIELD.NAME) as ASSET_SORT_FIELD,
        sortOrder: urlParams.getString('sortOrder', SORT_ORDER.ASCENDING) as SORT_ORDER,
    });
}

export function setAssetSearchUrlParams(params: Partial<IAssetSearchParams>) {
    const {urlParams} = superdeskApi.browser.location;

    urlParams.setString('textSearch', params.textSearch);
    urlParams.setString('setId', params.setId);
    urlParams.setString('name', params.name);
    urlParams.setString('description', params.description);
    urlParams.setStringArray('tags', (params.tags ?? []).map((tag) => (tag.code)));
    urlParams.setString('state', params.state);
    urlParams.setString('filename', params.filename);
    urlParams.setString('mimetypes', params.mimetypes);
    urlParams.setDate('dateFrom', params.dateFrom);
    urlParams.setDate('dateTo', params.dateTo);
    urlParams.setNumber('sizeFrom', params.sizeFrom);
    urlParams.setNumber('sizeTo', params.sizeTo);
    urlParams.setString('sortField', params.sortField);
    urlParams.setString('sortOrder', params.sortOrder);
}

export function getAssetsCount(set_ids: Array<string>): Promise<Dictionary<string, number>> {
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;

    return superdeskApi.dataApi.queryRawJson<Dictionary<string, number>>(
        COUNT_RESOURCE + JSON.stringify(set_ids),
    )
        .catch((error: any) => {
            if (isSamsApiError(error)) {
                notify.error(getApiErrorMessage(error));
            } else {
                notify.error(gettext('Failed to get assets counts for sets'));
            }

            return Promise.reject(error);
        });
}

export function getAssetById(assetId: string): Promise<IAssetItem> {
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;

    return superdeskApi.dataApi.findOne<IAssetItem>(RESOURCE, assetId)
        .then(fixItemVersionDates)
        .catch((error: any) => {
            if (isSamsApiError(error)) {
                notify.error(getApiErrorMessage(error));
            } else {
                notify.error(gettext(`Failed to get asset "${assetId}"`));
            }

            return Promise.reject(error);
        });
}

export function getAssetsByIds(ids: Array<string>): Promise<IRestApiResponse<IAssetItem>> {
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;

    return superdeskApi.dataApi.queryRawJson<IRestApiResponse<IAssetItem>>(
        RESOURCE,
        {source: JSON.stringify({
            query: {
                bool: {
                    must: [
                        superdeskApi.elasticsearch.terms({
                            field: '_id',
                            value: ids,
                        }),
                    ],
                },
            },
        })},
    )
        .then(fixItemResponseVersionDates)
        .catch((error: any) => {
            if (isSamsApiError(error)) {
                notify.error(getApiErrorMessage(error));
            } else {
                notify.error(gettext('Failed to get Assets'));
            }

            return Promise.reject(error);
        });
}

export function updateAssetMetadata(
    originalAsset: IAssetItem,
    originalAttachment: IAttachment,
    updates: Partial<IAssetItem>,
): Promise<[IAttachment, IAssetItem]> {
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;

    return Promise.all([
        superdeskApi.entities.attachment.save(originalAttachment, {
            ...originalAttachment,
            title: updates.name,
            description: updates.description,
            internal: updates.state !== ASSET_STATE.PUBLIC,
        }),
        superdeskApi.dataApi.patch<IAssetItem>(RESOURCE, originalAsset, updates)
            .catch((error: any) => {
                if (isSamsApiError(error)) {
                    notify.error(getApiErrorMessage(error));
                } else {
                    notify.error(gettext('Failed to update asset.'));
                }

                return Promise.reject(error);
            }),
    ]);
}

export function showUploadAssetModal(props?: Partial<IUploadAssetModalProps>): void {
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;
    const store = getStoreSync();

    // (re)load all the Sets into the Redux store
    store.dispatch<any>(loadSets())
        .then((sets: Array<ISetItem>) => {
            // Check if there are any usable Sets found
            // Otherwise notify the user to enable one first
            if (sets.filter((set) => set.state === SET_STATE.USABLE).length === 0) {
                notify.error(gettext('No usable Sets found. Enable one first'));
                return;
            }

            // Finally show the upload asset modal
            showModalConnectedToStore<Partial<IUploadAssetModalProps>>(
                UploadAssetModal,
                {
                    modalSize: 'fill',
                    ...props ?? {},
                },
            );
        });
}

export function getAssetDownloadUrl(assetId: IAssetItem['_id']): string {
    const {server} = superdeskApi.instance.config;

    return `${server.url}/${BINARY_RESOURCE}/${assetId}`;
}

export function getAssetBinary(asset: IAssetItem): Promise<void | Response> {
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;
    const {downloadBlob} = superdeskApi.utilities;

    return superdeskApi.dataApi.queryRaw<void | Response>(
        BINARY_RESOURCE + asset._id,
    )
        .then((res) => res.arrayBuffer()
            .then((blob: any) => {
                downloadBlob(blob, res.headers.get('Content-type')!, asset.filename);
            }))
        .catch((error: any) => {
            if (isSamsApiError(error)) {
                notify.error(getApiErrorMessage(error));
            } else {
                notify.error(gettext('Failed to get binary for asset'));
            }

            return Promise.reject(error);
        });
}

export function getAssetsCompressedBinary(asset_ids: Array<string>): Promise<void | Response> {
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;
    const {downloadBlob} = superdeskApi.utilities;

    return superdeskApi.dataApi.queryRaw<void | Response>(
        COMPRESSED_BINARY_RESOURCE + JSON.stringify(asset_ids),
    )
        .then((res) => res.arrayBuffer()
            .then((blob: any) => {
                downloadBlob(blob, 'application/zip', 'download');
            }))
        .catch((error: any) => {
            if (isSamsApiError(error)) {
                notify.error(getApiErrorMessage(error));
            } else {
                notify.error(gettext('Failed to get compressed binaries for assets'));
            }

            return Promise.reject(error);
        });
}

export function deleteAsset(item: IAssetItem): Promise<void> {
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;

    return superdeskApi.dataApi.delete<IAssetItem>(RESOURCE, item)
        .then(() => {
            notify.success(gettext('Asset deleted successfully'));

            return Promise.resolve();
        })
        .catch((error: any) => {
            if (isSamsApiError(error)) {
                notify.error(getApiErrorMessage(error));
            } else if (error._message != null) {
                notify.error(gettext('Error: {{message}}', {message: error._message}));
            } else {
                notify.error(gettext('Failed to delete the Asset'));
            }

            return Promise.reject(error);
        });
}

export function updateAsset(original: IAssetItem, updates: Partial<IAssetItem>): Promise<IAssetItem> {
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;

    return superdeskApi.dataApi.patch<IAssetItem>(RESOURCE, original, updates)
        .then((asset: IAssetItem) => {
            notify.success(gettext('Asset updated successfully'));

            return asset;
        })
        .catch((error: any) => {
            if (isSamsApiError(error)) {
                notify.error(getApiErrorMessage(error));
            } else {
                notify.error(gettext('Failed to update the Asset'));
            }

            return Promise.reject(error);
        });
}

export function lockAsset(original: IAssetItem, updates: Dictionary<string, any>): Promise<Partial<IAssetItem>> {
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;

    return superdeskApi.dataApi.patch<IAssetItem>(LOCK_ASSET, original, updates)
        .then((asset: IAssetItem) => {
            return asset;
        })
        .catch((error: any) => {
            if (isSamsApiError(error)) {
                notify.error(getApiErrorMessage(error));
            } else {
                notify.error(gettext('Failed to lock the Asset'));
            }

            return Promise.reject(error);
        });
}

export function unlockAsset(original: IAssetItem, updates: Dictionary<string, any>): Promise<Partial<IAssetItem>> {
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;

    return superdeskApi.dataApi.patch<IAssetItem>(UNLOCK_ASSET, original, updates)
        .then((asset: IAssetItem) => {
            return asset;
        })
        .catch((error: any) => {
            if (isSamsApiError(error)) {
                notify.error(getApiErrorMessage(error));
            } else {
                notify.error(gettext('Failed to unlock the Asset'));
            }

            return Promise.reject(error);
        });
}

export function getSetsSync(): Dictionary<string, ISetItem> {
    const store = getStoreSync();

    return getSetsById(store.getState());
}

export function searchTags(searchString: string): Promise<IAutoTaggingSearchResult> {
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;

    return superdeskApi.dataApi.queryRawJson<IAutoTaggingSearchResult>('sams/assets/tags', {'query': searchString})
        .then((res: IAutoTaggingSearchResult) => {
            return res;
        })
        .catch((error: any) => {
            if (isSamsApiError(error)) {
                notify.error(getApiErrorMessage(error));
            } else {
                notify.error(gettext('Failed to get tags'));
            }

            return Promise.reject(error);
        });
}
