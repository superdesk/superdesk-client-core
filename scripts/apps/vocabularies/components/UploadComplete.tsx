import {gettext} from 'core/utils';
import React from 'react';

export const UploadComplete = () => {
    return (
        <div className="file-uploaded">
            <span><i className="icon-ok icon--green" /></span>
            <p>{gettext('Your upload was successfull')}</p>
        </div>
    );
};
