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

function onTemplateCreate(item: any, field: any) {
    const initialOffset = field.custom_field_config.initial_offset_minutes;

    item.extra[field._id] = `{{ now|add_timedelta(minutes=${initialOffset})|iso_datetime }}`;
    return item;
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
                        templateEditorComponent: getToggleDateTimeField(superdesk),
                        onTemplateCreate: (item: any, field: any) => onTemplateCreate(item, field),
                    },
                ],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
