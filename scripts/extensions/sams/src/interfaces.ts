// Types
import {
    IAttachment,
    IBaseRestApiResponse,
    IRestApiResponse,
    IUser,
    IWebsocketMessage,
} from 'superdesk-api';
import {IModalSize} from './ui/modal';

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

export enum ASSET_CONTENT_PANEL_STATE {
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

export enum ASSET_ACTIONS {
    PREVIEW = 'preview',
    DOWNLOAD = 'download',
    DELETE = 'delete',
    EDIT = 'edit',
    FORCE_UNLOCK = 'force_unlock',
}

export enum DATA_UNIT {
    BYTES = 'bytes',
    KB = 'kb',
    MB = 'mb',
    GB = 'gb',
}

export interface IBaseAssetAction {
    id: ASSET_ACTIONS;
    label: string;
    icon: string;
}

export interface IAssetAction extends IBaseAssetAction {
    onSelect(asset: Partial<IAssetItem>): void;
    isAllowed(asset: Partial<IAssetItem>): boolean;
}

export interface IAssetCallback {
    action: ASSET_ACTIONS;
    onSelect(asset: Partial<IAssetItem>): void;
}

export interface IBulkAction extends IBaseAssetAction {
    onSelect(): void;
}

export interface IBulkActionAssetCallback {
    action: ASSET_ACTIONS;
    onSelect(): void;
}

export interface IVersionInformation extends IBaseRestApiResponse{
    firstcreated: string;
    versioncreated: string;
    original_creator?: IUser['_id'];
    version_creator?: IUser['_id'];
}

export interface ISetItem extends IVersionInformation {
    name: string;
    state: SET_STATE;
    description?: string;
    maximum_asset_size?: number;
    destination_name?: string;
    destination_config?: Dictionary<string, any>;
    destination?: IStorageDestinationItem;
}

export interface IStorageDestinationItem extends IBaseRestApiResponse {
    provider?: string;
}

export interface ISAMSBaseEvent {
    // Every event from SAMS should contain the following
    user_id: string;
    session_id: string;
    extension: 'sams';

    // These attributes are provided with most events from SAMS
    item_id?: string;
    _etag?: string;
}

export type ISAMSWebsocketEvent = CustomEvent<IWebsocketMessage<ISAMSBaseEvent>>;

export interface IAutoTaggingSearchResult {
    tags: Array<string>;
}

export interface IAssetTag {
    name: string;
    code: string;
}

export interface IAssetItem extends IVersionInformation {
    set_id: string;
    parent_id: string;
    state: ASSET_STATE;
    filename: string;
    length: number;
    mimetype: string;
    name: string;
    description: string;
    lock_action: string;
    lock_user: string;
    lock_session: string;
    tags: Array<IAssetTag>;
    extra: Dictionary<string, any>;
}

export interface IAssetSearchParams {
    textSearch?: string;
    setId?: string;
    setIds?: Array<string>;
    excludedAssetIds?: Array<string>;
    name?: string;
    description?: string;
    state?: ASSET_STATE;
    states?: Array<ASSET_STATE>;
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

export interface IAPIError {
    error: string;
    name: string;
    description: string;
    errors?: {[field: string]: Array<string>};
}

export interface IUploadAssetModalProps {
    closeModal(): void;
    sets: Array<ISetItem>;
    dark?: boolean;
    modalSize?: IModalSize;
    initialFiles?: Array<{
        id: string;
        file: File;
    }>;
    onAssetUploaded?(asset: IAssetItem): Promise<void>;
    onModalClosed?(assets?: Dictionary<string, IAssetItem>): void;
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
        upload(data: FormData, onProgress?: (event: ProgressEvent) => void): Promise<IAssetItem>;
        update(original: IAssetItem, updates: Partial<IAssetItem>): Promise<IAssetItem>;
        query(params: IAssetSearchParams, listStyle: ASSET_LIST_STYLE): Promise<IRestApiResponse<IAssetItem>>;
        getSearchUrlParams(): Partial<IAssetSearchParams>;
        setSearchUrlParams(params: Partial<IAssetSearchParams>): void;
        getCount(set_ids: Array<string>): Promise<Dictionary<string, number>>;
        getById(assetId: string): Promise<IAssetItem>;
        getByIds(ids: Array<string>): Promise<IRestApiResponse<IAssetItem>>;
        updateMetadata(
            originalAsset: IAssetItem,
            originalAttachment: IAttachment,
            updates: Partial<IAssetItem>,
        ): Promise<[IAttachment, IAssetItem]>;
        showUploadModal(props?: Partial<IUploadAssetModalProps>): void;
        getCompressedBinary(asset_ids: Array<string>): void;
        getAssetBinary(asset: IAssetItem): Promise<void | Response>;
        deleteAsset(asset: IAssetItem): Promise<void>;
        lockAsset(asset: IAssetItem, updates: Dictionary<string, any>): Promise<Partial<IAssetItem>>;
        unlockAsset(asset: IAssetItem, updates: Dictionary<string, any>): Promise<Partial<IAssetItem>>;
        searchTags(searchTags: string): Promise<IAutoTaggingSearchResult>;
    };
}
