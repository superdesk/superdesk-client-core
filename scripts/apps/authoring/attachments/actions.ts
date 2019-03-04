import {gettext, gettextCatalog} from 'core/utils';
import {filesize} from 'core/ui/ui';

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
export function selectFiles(files: Array<File>) {
    return (dispatch, getState, {notify, superdesk, $filter}) => {
        const state = getState();

        if (Array.isArray(files) && files.length > 0 && !state.editor.isLocked) {
            if (files.length + state.attachments.files.length > state.attachments.maxFiles) {
                notify.error(gettextCatalog.getPlural(state.attachments.maxFiles,
                    'Too many files selected. Only 1 file is allowed.',
                    'Too many files selected. Only {{$count}} files are allowed.',
                ));
                return;
            }

            const filenames = files.filter((file) => file.size > state.attachments.maxSize)
                .map((file) => file.name);

            if (filenames.length) {
                notify.error(gettext(
                    'Sorry, but some files "{{ filenames }}" are bigger than limit ({{ limit }}).',
                    {
                        filenames: filenames.join(', '),
                        limit: filesize(state.attachments.maxSize),
                    },
                ));
                return;
            }

            superdesk
                .intent('upload', 'attachments', files)
                .then((uploadedFiles) => {
                    dispatch({type: ADD_ATTACHMENTS, payload: uploadedFiles});
                });
        }
    };
}

export const REMOVE_ATTACHMENT = 'REMOVE_ATTACHMENT';
export function removeFile(file) {
    return {type: REMOVE_ATTACHMENT, payload: file};
}

export const OPEN_ATTACHMENT_FOR_EDITING = 'OPEN_ATTACHMENT_FOR_EDITING';
export function editFile(file) {
    return {type: OPEN_ATTACHMENT_FOR_EDITING, payload: file};
}

export const UPDATE_ATTACHMENT = 'UPDATE_ATTACHMENT';
export function saveFile(file, diff) {
    return (dispatch, getState, {attachments}) => {
        attachments.save(file, diff).then((updated) => {
            dispatch({type: UPDATE_ATTACHMENT, payload: updated});
            dispatch(closeEdit());
        });
    };
}

export const CLOSE_ATTACHMENT_EDITOR = 'CLOSE_ATTACHMENT_EDITOR';
export function closeEdit() {
    return {type: CLOSE_ATTACHMENT_EDITOR};
}

export function download(file) {
    return (dispatch, getState, {urls}) => {
        window.open(urls.media(file.media, 'attachments'), '_blank');
    };
}
