import {gettext} from 'core/utils';
import React from 'react';

export const UploadComplete = () => {
    return (
        <div className="file-uploaded">
            <i className="big-icon--checkmark-circle sd-file-upload__icon" />
            <p>{gettext('Your upload was successful')}</p>
        </div>
    );
};
