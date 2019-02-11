import {
    INIT_ATTACHMENTS,
    ADD_ATTACHMENTS,
    REMOVE_ATTACHMENT,
    EDIT_ATTACHMENT,
    SAVE_ATTACHMENT,
} from './actions';

const initialState = {
    diff: null,
    file: null,
    files: [],
    maxSize: 0,
    maxFiles: 10,
};

export function attachments(state = initialState, action) {
    switch (action.type) {
    case INIT_ATTACHMENTS:
        return {...action.payload};
    case ADD_ATTACHMENTS:
        return {...state, files: state.files.concat(action.payload)};
    case REMOVE_ATTACHMENT:
        return {...state, files: state.files.filter((f) => f !== action.payload)};
    case EDIT_ATTACHMENT:
        return {...state, file: action.payload, diff: action.payload != null ? Object.create(action.payload) : null};
    case SAVE_ATTACHMENT:
        return {...state, file: null, diff: null, files: state.files.map((f) => f._id !== action.payload._id ? f : action.payload)};
    default:
        return state;
    }
}