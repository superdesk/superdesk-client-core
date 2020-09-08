// Types
import {IBaseRestApiResponse, ISuperdesk} from 'superdesk-api';

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

export interface ISetItem extends IBaseRestApiResponse {
    name: string;
    state: SET_STATE;
    description?: string;
    destination_name?: string;
    destination_config?: Dictionary<string, any>;
    destination?: IStorageDestinationItem;
    count?: number;
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
        getCount(set_ids: string[]): Promise<object>;
    };
}

export type IConnectComponentToSuperdesk = (superdesk: ISuperdesk) => React.ComponentType;
