import React from 'react';
import {IInputType} from '../interfaces/input-types';
import {CopyableTextBox} from 'superdesk-ui-framework/react';

export const ReadonlyCopyableText: React.FC<IInputType<string>> = (props) => {
    const defaultValue = props.formField.component_parameters?.defaultAfterCreation;

    return (
        <CopyableTextBox
            value={
                props.formValues._id != null
                    ? props.value ?? defaultValue
                    : props.value
            }
            disableCopyButton={props.formValues._id == null}
            label={props.formField.label}
            toastMessagePosition="top-right"
            info={props.formField.component_parameters?.infoText}
        />
    );
};
