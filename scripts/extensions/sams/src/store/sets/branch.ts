// Types
import {CONTENT_PANEL_STATE, ISetItem, IApplicationState} from '../../interfaces';

// Utils
import {genBranchLeaf} from '../../utils/redux';

export const setsInitialState: IApplicationState['sets'] = {
    sets: [],
    contentPanelState: CONTENT_PANEL_STATE.CLOSED,
    selectedSetId: undefined,
};

export const setsBranch = {
    receive: genBranchLeaf<IApplicationState['sets'], Array<ISetItem>>({
        id: 'sets__receive',
        reducer: (state, payload) => ({
            ...state,
            sets: payload,
        }),
    }),
    updateSet: genBranchLeaf<IApplicationState['sets'], ISetItem>({
        id: 'sets__update_set_in_store',
        reducer: (state, payload) => ({
            ...state,
            sets: state.sets.map(
                (set: ISetItem) => {
                    return set._id === payload._id ?
                        payload :
                        set;
                },
            ),
        }),
    }),
    removeSet: genBranchLeaf<IApplicationState['sets'], ISetItem>({
        id: 'sets__remove_set_in_store',
        reducer: (state, payload) => ({
            ...state,
            sets: state.sets.filter(
                (set: ISetItem) => set._id !== payload._id,
            ),
        }),
    }),
    editSet: genBranchLeaf<IApplicationState['sets'], string>({
        id: 'manage_sets__edit',
        reducer: (state, payload) => ({
            ...state,
            contentPanelState: CONTENT_PANEL_STATE.EDIT,
            selectedSetId: payload,
        }),
    }),
    previewSet: genBranchLeaf<IApplicationState['sets'], string>({
        id: 'manage_sets__preview',
        reducer: (state, payload) => ({
            ...state,
            contentPanelState: CONTENT_PANEL_STATE.PREVIEW,
            selectedSetId: payload,
        }),
    }),
    closeContentPanel: genBranchLeaf<IApplicationState['sets']>({
        id: 'manage_sets__close_content_panel',
        reducer: (state) => ({
            ...state,
            contentPanelState: CONTENT_PANEL_STATE.CLOSED,
            selectedSetId: undefined,
        }),
    }),
    onManageSetsModalClosed: genBranchLeaf<IApplicationState['sets']>({
        id: 'manage_sets__reset',
        reducer: (state) => ({
            ...state,
            contentPanelState: CONTENT_PANEL_STATE.CLOSED,
            selectedSetId: undefined,
        }),
    }),
};
