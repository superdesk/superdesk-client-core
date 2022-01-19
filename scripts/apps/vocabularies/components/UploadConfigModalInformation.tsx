import React from 'react';
import {gettext} from 'core/utils';

export const UploadconfigModalInformation = ({label}) => {
    return (
        <div className="sd-alert sd-alert--hollow sd-alert--primary">
            <span>
                <i className="big-icon--info big-icon--blue" style={{margin: '0 0.6rem 0 -0.3rem'}} />
            </span>
            <span>
                {label}
            </span>
        </div>
    );
};
