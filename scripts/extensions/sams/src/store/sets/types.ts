// Types
import {CONTENT_PANEL_STATE, ISetItem} from '../../interfaces';

export const RECEIVE_SETS = 'sets__receive';
interface IReceiveSetsAction {
    type: typeof RECEIVE_SETS;
    payload: Array<ISetItem>;
}

export const UPDATE_SET_IN_STORE = 'sets__update_set_in_store';
interface IUpdateSetInStoreAction {
    type: typeof UPDATE_SET_IN_STORE;
    payload: ISetItem;
}

export const REMOVE_SET_IN_STORE = 'sets__remove_set_in_store';
interface IRemoveSetInStoreAction {
    type: typeof REMOVE_SET_IN_STORE;
    paylaod: ISetItem;
}

export const MANAGE_SETS_EDIT = 'manage_sets__edit';
interface IEditSetAction {
    type: typeof MANAGE_SETS_EDIT;
    payload?: string;
}

export const MANAGE_SETS_PREVIEW = 'manage_sets__preview';
interface IPreviewSetAction {
    type: typeof MANAGE_SETS_PREVIEW;
    payload: string;
}

export const MANAGE_SETS_CLOSE_CONTENT_PANEL = 'manage_sets__close_content_panel';
interface ICloseSetAction {
    type: typeof MANAGE_SETS_CLOSE_CONTENT_PANEL;
}

export const MANAGE_SETS_DELETE_CONFIRMATION_OPEN = 'manage_sets__delete_confirmation_open';
interface ISetDeleteConfirmationOpenAction {
    type: typeof MANAGE_SETS_DELETE_CONFIRMATION_OPEN;
    payload: boolean;
}

export const MANAGE_SETS_ON_CLOSED = 'manage_sets__on_closed';
interface IManageSetsOnModalClosed {
    type: typeof MANAGE_SETS_ON_CLOSED;
}

export type ISetActionTypes = IReceiveSetsAction |
    IUpdateSetInStoreAction |
    IRemoveSetInStoreAction |
    IEditSetAction |
    IPreviewSetAction |
    ICloseSetAction |
    ISetDeleteConfirmationOpenAction |
    IManageSetsOnModalClosed;

export interface ISetState {
    sets: Array<ISetItem>;
    contentPanelState: CONTENT_PANEL_STATE;
    selectedSetId?: string;
    deleteConfirmationOpen: boolean;
}
