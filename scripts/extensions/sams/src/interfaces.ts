// Types
import {
    IBaseRestApiResponse,
    IRestApiResponse,
    ISuperdesk,
} from 'superdesk-api';

export enum SET_STATE {
    DRAFT = 'draft',
    USABLE = 'usable',
    DISABLED = 'disabled',
}

export enum ASSET_STATE {
    DRAFT = 'draft',
    INTERNAL = 'internal',
    PUBLIC = 'public',
}

export enum CONTENT_PANEL_STATE {
    CLOSED = 'closed',
    PREVIEW = 'preview',
    EDIT = 'edit',
    CREATE = 'create',
}

export enum ASSET_TYPE_FILTER {
    ALL = 'all',
    IMAGES = 'images',
    VIDEOS = 'videos',
    AUDIO = 'audio',
    DOCUMENTS = 'documents',
}

export enum ASSET_LIST_STYLE {
    GRID = 'grid',
    LIST = 'list',
}

export enum ASSET_SORT_FIELD {
    NAME = 'name.keyword',
    FILENAME = 'filename',
    CREATED = '_created',
    UPDATED = '_updated',
    SIZE = 'length',
}

export enum SORT_ORDER {
    ASCENDING = 'ascending',
    DESCENDING = 'descending',
}

export enum LIST_ACTION {
    APPEND = 'append',
    REPLACE = 'replace',
}

export interface ISetItem extends IBaseRestApiResponse {
    name: string;
    state: SET_STATE;
    description?: string;
    destination_name?: string;
    destination_config?: Dictionary<string, any>;
    destination?: IStorageDestinationItem;
}

export interface IStorageDestinationItem extends IBaseRestApiResponse {
    provider?: string;
}

export interface IAssetItem extends IBaseRestApiResponse {
    set_id: string;
    parent_id: string;
    state: ASSET_STATE;
    filename: string;
    length: number;
    mimetype: string;
    name: string;
    description: string;
    tags: Array<{
        code: string;
        name: string;
    }>;
    extra: Dictionary<string, any>;
}

export interface IAssetSearchParams {
    textSearch?: string;
    setId?: string;
    name?: string;
    description?: string;
    state?: ASSET_STATE;
    filename?: string;
    page: number;
    mimetypes: ASSET_TYPE_FILTER;
    dateFrom?: Date;
    dateTo?: Date;
    sizeFrom?: number;
    sizeTo?: number;
    sortField: ASSET_SORT_FIELD;
    sortOrder: SORT_ORDER;
}

export interface ISamsAPI {
    sets: {
        getAll(): Promise<Array<ISetItem>>;
        create(set: Partial<ISetItem>): Promise<ISetItem>;
        update(original: ISetItem, updates: Partial<ISetItem>): Promise<ISetItem>;
        delete(set: ISetItem): Promise<void>;
    };
    storageDestinations: {
        getAll(): Promise<Array<IStorageDestinationItem>>;
    };
    assets: {
        upload(data: FormData, onProgress?: (event: ProgressEvent) => void): Promise<any>;
        query(params: IAssetSearchParams, listStyle: ASSET_LIST_STYLE): Promise<IRestApiResponse<IAssetItem>>;
        getSearchUrlParams(): Partial<IAssetSearchParams>;
        setSearchUrlParams(params: Partial<IAssetSearchParams>): void;
    };
}

export type IConnectComponentToSuperdesk = (superdesk: ISuperdesk) => React.ComponentType<any>;
