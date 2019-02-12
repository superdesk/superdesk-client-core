import {
    INIT_ATTACHMENTS,
    ADD_ATTACHMENTS,
    REMOVE_ATTACHMENT,
    EDIT_ATTACHMENT,
    SAVE_ATTACHMENT,
} from './actions';

const initialState = {
    edit: null,
    files: [],
    maxSize: 0,
    maxFiles: 10,
};

export function attachments(state = initialState, action: {type: string, payload: any}) {
    switch (action.type) {
    case INIT_ATTACHMENTS:
        return {...action.payload};
    case ADD_ATTACHMENTS:
        return {...state, files: state.files.concat(action.payload)};
    case REMOVE_ATTACHMENT:
        return {...state, files: state.files.filter((f) => f !== action.payload)};
    case EDIT_ATTACHMENT:
        return {
            ...state,
            edit: action.payload,
        };
    case SAVE_ATTACHMENT:
        return {
            ...state,
            edit: null,
            files: state.files.map((f) => f._id !== action.payload._id ? f : action.payload),
        };
    default:
        return state;
    }
}
