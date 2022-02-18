import * as React from 'react';

import {
    ISuperdesk,
    IExtension,
    IExtensionActivationResult,
    IPreviewComponentProps,
} from 'superdesk-api';
import {getDateTimeField} from './getDateTimeField';
import {getConfigComponent} from './getConfigComponent';
import {getToggleDateTimeField} from './getToggleTemplateDateTimeField';

export function isDateValue(value: string | undefined | null) {
    if (value == null) {
        return false;
    } else {
        return isNaN(Date.parse(value)) !== true;
    }
}

function getDateTimePreviewComponent(superdesk: ISuperdesk) {
    const {formatDateTime} = superdesk.localization;

    return class DateTimePreview extends React.PureComponent<IPreviewComponentProps<string>> {
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

function onTemplateCreate(_value: string, config: IDateTimeFieldConfig) {
    const initialOffset = config.initial_offset_minutes;

    return `{{ now|add_timedelta(minutes=${initialOffset})|iso_datetime }}`;
}

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
                        templateEditorComponent: getToggleDateTimeField(superdesk),
                        onTemplateCreate: onTemplateCreate,
                    },
                ],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
