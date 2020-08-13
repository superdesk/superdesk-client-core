// Types
import {Action, Store} from 'redux';
import {ThunkAction} from 'redux-thunk';
import {IBaseRestApiResponse, IExtension, ISuperdesk} from 'superdesk-api';

export interface ISamsExtension extends IExtension {
    exposes: {
        store?: Store;
    };
}

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
}

export type IApplicationState = {
    sets: {
        sets: Array<ISetItem>;
        contentPanelState: CONTENT_PANEL_STATE;
        selectedSetId?: string;
    };
    storageDestinations: {
        destinations: Array<IStorageDestinationItem>;
    };
};

export interface IThunkExtraArguments {
    api: ISamsAPI;
    superdesk: ISuperdesk;
}

export type IThunkAction<R> = ThunkAction<
    Promise<R>,
    IApplicationState,
    IThunkExtraArguments,
    Action
>;

export type IConnectComponentToSuperdesk = (superdesk: ISuperdesk) => React.ComponentType;
