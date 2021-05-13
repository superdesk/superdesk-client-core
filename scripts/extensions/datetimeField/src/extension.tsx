import * as React from 'react';

import {
    ISuperdesk,
    IExtension,
    IExtensionActivationResult,
    IPreviewComponentProps,
} from 'superdesk-api';
import {getDateTimeField} from './getDateTimeField';
import {getTemplateDateTimeField} from './getTemplateDateTimeField';
import {getConfigComponent} from './getConfigComponent';

export function isDateValue(value: string | undefined | null) {
    if (value == null) {
        return false;
    } else {
        return isNaN(Date.parse(value)) !== true;
    }
}

function getDateTimePreviewComponent(superdesk: ISuperdesk) {
    const {formatDateTime} = superdesk.localization;

    return class DateTimePreview extends React.PureComponent<IPreviewComponentProps> {
        render() {
            if (this.props.value == null) {
                return null;
            } else {
                return <div>{formatDateTime(new Date(this.props.value))}</div>;
            }
        }
    };
}

export interface IDateTimeFieldConfig {
    initial_offset_minutes: number;
    increment_steps: Array<number>;
}

export const defaultDateTimeConfig: IDateTimeFieldConfig = {
    initial_offset_minutes: 0,
    increment_steps: [],
};

const extension: IExtension = {
    activate: (superdesk: ISuperdesk) => {
        const gettext = superdesk.localization.gettext;

        const result: IExtensionActivationResult = {
            contributions: {
                customFieldTypes: [
                    {
                        id: 'datetime',
                        label: gettext('Datetime'),
                        editorComponent: getDateTimeField(superdesk),
                        previewComponent: getDateTimePreviewComponent(superdesk),
                        configComponent: getConfigComponent(superdesk),
                        templateEditorComponent: getTemplateDateTimeField(superdesk),
                    },
                ],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
