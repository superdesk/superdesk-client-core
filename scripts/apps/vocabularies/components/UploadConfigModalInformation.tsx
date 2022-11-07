import React from 'react';

export const UploadConfigModalInformation = ({label}) => {
    return (
        <div className="sd-alert sd-alert--hollow sd-alert--primary sd-alert--margin-normal">
            <span>
                <i className="big-icon--info big-icon--blue" style={{margin: '0 0.6rem 0 -0.3rem'}} />
            </span>
            <span>{label}</span>
        </div>
    );
};
