import {gettext} from 'core/utils';

export const INIT_ATTACHMENTS = 'INIT_ATTACHMENTS';
export function initAttachments(item) {
    return (dispatch, geState, {deployConfig, attachments}) => {
        attachments.byItem(item)
            .then((files) => {
                dispatch({
                    type: INIT_ATTACHMENTS,
                    payload: {
                        files: files,
                        maxSize: deployConfig.getSync('attachments_max_size'),
                        maxFiles: deployConfig.getSync('attachments_max_files'),
                    },
                });
            });
    };
}

export const ADD_ATTACHMENTS = 'ADD_ATTACHMENTS';
export function selectFiles(files) {
    return (dispatch, getState, {$scope, notify, superdesk}) => {
        const state = getState();

        if (Array.isArray(files) && files.length > 0 && !state.editor.isLocked) {
            if (files.length + state.attachments.files.length > state.attachments.maxFiles) {
                notify.error(gettext('Sorry, too many files selected.'));
                return;
            }

            const bigFiles = files.filter((file) => file.size > state.attachments.maxSize);

            if (bigFiles.length) {
                notify.error(gettext('Sorry, but some files are too big.'));
                return;
            }

            superdesk
                .intent('upload', 'attachments', files)
                .then((uploadedFiles) => {
                    dispatch({type: ADD_ATTACHMENTS, payload: uploadedFiles});
                    updateItem(getState(), $scope);
                });
        }
    };
}

export const REMOVE_ATTACHMENT = 'REMOVE_ATTACHMENT';
export function removeFile(file) {
    return (dispatch, getState, {$scope}) => {
        dispatch({type: REMOVE_ATTACHMENT, payload: file});
        updateItem(getState(), $scope);
    };
}

export const EDIT_ATTACHMENT = 'EDIT_ATTACHMENT';
export function editFile(file) {
    return {type: EDIT_ATTACHMENT, payload: file};
}

export const SAVE_ATTACHMENT = 'SAVE_ATTACHMENT';
export function saveFile(file, diff) {
    return (dispatch, getState, {attachments}) => {
        attachments.save(file, diff).then((updated) => {
            dispatch({type: SAVE_ATTACHMENT, payload: updated});
            dispatch(closeEdit());
        });
    };
}

export function closeEdit() {
    return {type: EDIT_ATTACHMENT, payload: null};
}

export function download(file) {
    return (dispatch, getState, {urls}) => {
        window.open(urls.media(file.media, 'attachments'), '_blank');
    };
}

function updateItem(state, $scope) {
    $scope.item.attachments = state.attachments.files.map((f) => ({attachment: f._id}));
    $scope.autosave();
}
