// Types
import {
    IElasticRangeQueryParams,
    IRestApiResponse,
    IRootElasticQuery,
    ISuperdesk,
} from 'superdesk-api';
import {
    ASSET_LIST_STYLE, ASSET_SORT_FIELD,
    ASSET_STATE,
    ASSET_TYPE_FILTER,
    IAssetItem,
    IAssetSearchParams,
    SORT_ORDER,
} from '../interfaces';

// Utils
import {isSamsApiError, getApiErrorMessage} from '../utils/api';

const RESOURCE = 'sams/assets';
const COUNT_RESOURCE = `${RESOURCE}/counts/`;

export function uploadAsset(
    superdesk: ISuperdesk,
    data: FormData,
    onProgress: (event: ProgressEvent) => void,
): Promise<IAssetItem> {
    return superdesk.dataApi.uploadFileWithProgress(
        '/' + RESOURCE,
        data,
        onProgress,
    );
}

const GRID_PAGE_SIZE = 25;
const LIST_PAGE_SIZE = 50;

function querySearchString(superdesk: ISuperdesk, source: IRootElasticQuery, params: IAssetSearchParams) {
    if (params.textSearch != null && params.textSearch.length > 0) {
        source.query.bool.must.push(
            superdesk.elasticsearch.queryString({
                query: params.textSearch,
                lenient: true,
                default_operator: 'OR',
            }),
        );
    }
}

function querySetId(superdesk: ISuperdesk, source: IRootElasticQuery, params: IAssetSearchParams) {
    if (params.setId != null && params.setId.length > 0) {
        source.query.bool.must.push(
            superdesk.elasticsearch.term({
                field: 'set_id',
                value: params.setId,
            }),
        );
    }
}

function queryState(superdesk: ISuperdesk, source: IRootElasticQuery, params: IAssetSearchParams) {
    if (params.state != null) {
        source.query.bool.must.push(
            superdesk.elasticsearch.term({
                field: 'state',
                value: params.state,
            }),
        );
    }
}

function queryName(superdesk: ISuperdesk, source: IRootElasticQuery, params: IAssetSearchParams) {
    if (params.name != null && params.name.length > 0) {
        source.query.bool.must.push(
            superdesk.elasticsearch.queryString({
                query: `name:(${params.name})`,
                lenient: false,
                default_operator: 'OR',
            }),
        );
    }
}

function queryFilename(superdesk: ISuperdesk, source: IRootElasticQuery, params: IAssetSearchParams) {
    if (params.filename != null && params.filename.length > 0) {
        source.query.bool.must.push(
            superdesk.elasticsearch.queryString({
                query: `filename:(${params.filename})`,
                lenient: false,
                default_operator: 'OR',
            }),
        );
    }
}

function queryDescription(superdesk: ISuperdesk, source: IRootElasticQuery, params: IAssetSearchParams) {
    if (params.description != null && params.description.length > 0) {
        source.query.bool.must.push(
            superdesk.elasticsearch.queryString({
                query: `description:(${params.description})`,
                lenient: false,
                default_operator: 'OR',
            }),
        );
    }
}

function queryMimetypes(superdesk: ISuperdesk, source: IRootElasticQuery, params: IAssetSearchParams) {
    if (params.mimetypes === ASSET_TYPE_FILTER.DOCUMENTS) {
        source.query.bool.must_not.push(
            superdesk.elasticsearch.queryString({
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
                superdesk.elasticsearch.queryString({
                    query: `mimetype:(${typeString}\\/*)`,
                    lenient: true,
                    default_operator: 'OR',
                }),
            );
        }
    }
}

function queryDateRange(superdesk: ISuperdesk, source: IRootElasticQuery, params: IAssetSearchParams) {
    if (params.dateFrom != null || params.dateTo != null) {
        const args: IElasticRangeQueryParams = {field: '_updated'};

        if (params.dateFrom != null) {
            args.gte = params.dateFrom.toISOString();
        }

        if (params.dateTo != null) {
            args.lte = params.dateTo.toISOString();
        }

        source.query.bool.must.push(
            superdesk.elasticsearch.range(args),
        );
    }
}

function querySizeRange(superdesk: ISuperdesk, source: IRootElasticQuery, params: IAssetSearchParams) {
    if (params.sizeFrom != null || params.sizeTo != null) {
        const args: IElasticRangeQueryParams = {field: 'length'};

        if (params.sizeFrom != null) {
            args.gte = params.sizeFrom * 1048576; // MB -> bytes
        }

        if (params.sizeTo != null) {
            args.lte = params.sizeTo * 1048576; // MB -> bytes
        }

        source.query.bool.must.push(
            superdesk.elasticsearch.range(args),
        );
    }
}

export function queryAssets(
    superdesk: ISuperdesk,
    params: IAssetSearchParams,
    listStyle: ASSET_LIST_STYLE,
): Promise<IRestApiResponse<IAssetItem>> {
    const {gettext} = superdesk.localization;
    const {notify} = superdesk.ui;
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
        queryName,
        queryDescription,
        queryFilename,
        queryMimetypes,
        queryState,
        queryDateRange,
        querySizeRange,
    ].forEach((func) => func(superdesk, source, params));

    if (source.query.bool.must.length === 0) {
        delete source.query.bool.must;
    }

    if (source.query.bool.must_not.length === 0) {
        delete source.query.bool.must_not;
    }

    if (Object.keys(source.query.bool).length === 0) {
        delete source.query;
    }

    const sortOrder = params.sortOrder === SORT_ORDER.ASCENDING ? 1 : 0;
    const sort = `[("${params.sortField}",${sortOrder})]`;

    return superdesk.dataApi.queryRaw<IRestApiResponse<IAssetItem>>(
        RESOURCE,
        {
            source: JSON.stringify(source),
            sort: sort,
        },
    )
        .catch((error: any) => {
            if (isSamsApiError(error)) {
                notify.error(getApiErrorMessage(superdesk, error));
            } else {
                notify.error(gettext('Failed to query Assets'));
            }

            return Promise.reject(error);
        });
}

export function getAssetSearchUrlParams(superdesk: ISuperdesk): Partial<IAssetSearchParams> {
    const {urlParams} = superdesk.browser.location;
    const {filterUndefined} = superdesk.helpers;

    return filterUndefined<IAssetSearchParams>({
        textSearch: urlParams.getString('textSearch'),
        setId: urlParams.getString('setId'),
        name: urlParams.getString('name'),
        description: urlParams.getString('description'),
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

export function setAssetSearchUrlParams(superdesk: ISuperdesk, params: Partial<IAssetSearchParams>) {
    const {urlParams} = superdesk.browser.location;

    urlParams.setString('textSearch', params.textSearch);
    urlParams.setString('setId', params.setId);
    urlParams.setString('name', params.name);
    urlParams.setString('description', params.description);
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

export function getAssetsCount(superdesk: ISuperdesk, set_ids: Array<string>): Promise<Dictionary<string, number>> {
    const {gettext} = superdesk.localization;
    const {notify} = superdesk.ui;

    return superdesk.dataApi.queryRaw<Dictionary<string, number>>(
        COUNT_RESOURCE + JSON.stringify(set_ids),
    )
        .catch((error: any) => {
            notify.error(gettext('Failed to get assets counts for sets'));
            return Promise.reject(error);
        });
}
