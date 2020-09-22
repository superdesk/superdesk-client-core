// Types
import {CONTENT_PANEL_STATE, ISetItem} from '../../interfaces';

export const RECEIVE_SETS = 'sets__receive';
interface IReceiveSetsAction {
    type: typeof RECEIVE_SETS;
    payload: Array<ISetItem>;
}

export const REMOVE_SET_IN_STORE = 'sets__remove_set_in_store';
interface IRemoveSetInStoreAction {
    type: typeof REMOVE_SET_IN_STORE;
    payload: ISetItem;
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

export const MANAGE_SETS_RESET = 'manage_sets__reset';
interface IManageSetsOnModalClosed {
    type: typeof MANAGE_SETS_RESET;
}

export const RECEIVE_ASSETS_COUNT = 'assets_count_receive';
interface IReceiveAssetsCountAction {
    type: typeof RECEIVE_ASSETS_COUNT;
    payload: Dictionary<string, number>;
}

export type ISetActionTypes = IReceiveSetsAction |
    IRemoveSetInStoreAction |
    IEditSetAction |
    IPreviewSetAction |
    ICloseSetAction |
    IManageSetsOnModalClosed |
    IReceiveAssetsCountAction;

export interface ISetState {
    sets: Array<ISetItem>;
    contentPanelState: CONTENT_PANEL_STATE;
    selectedSetId?: string;
    counts: Dictionary<string, number>;
}
