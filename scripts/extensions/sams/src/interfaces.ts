import {IBaseRestApiResponse} from 'superdesk-api';

export enum SET_STATE {
    DRAFT = 'draft',
    USABLE = 'usable',
    DISABLED = 'disabled',
}

export enum CONTENT_PANEL_STATE {
    CLOSED = 'closed',
    PREVIEW = 'preview',
    EDIT = 'edit',
    CREATE = 'create',
}

export enum MODAL_TYPES {
    NONE = '',
    MANAGE_SETS = 'manage_sets',
}

export interface ISet {
    // _id?: string;
    name?: string;
    state?: SET_STATE;
    description?: string;
    destination_name?: string;
    destination_config?: {[key: string]: any};
    destination?: IStorageDestinationItem;
}

export interface ISetItem extends IBaseRestApiResponse, ISet {}

export interface IStorageDestination {
    provider?: string;
}

export interface IStorageDestinationItem extends IBaseRestApiResponse, IStorageDestination {}

export interface ISamsAPI {
    sets: {
        getAll(): Promise<Array<ISetItem>>;
        create(set: ISet): Promise<ISetItem>;
        update(original: ISetItem, updates: ISet): Promise<ISetItem>;
        delete(set: ISetItem): Promise<void>;
        confirmAndDelete(set: ISetItem): Promise<void>;
    };
    storageDestinations: {
        getAll(): Promise<Array<IStorageDestinationItem>>;
    };
}
