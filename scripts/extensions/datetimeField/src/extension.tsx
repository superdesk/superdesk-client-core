import * as React from 'react';

import {
    ISuperdesk,
    IExtension,
    IExtensionActivationResult,
    IPreviewComponentProps,
    ICustomFieldType,
} from 'superdesk-api';
import {
    getDateTimeField,
    IDateTimeFieldConfig,
    IUserPreferences,
    IValueOperational,
    IValueStorage,
} from './getDateTimeField';
import {getConfigComponent} from './getConfigComponent';
import {getToggleDateTimeField} from './getToggleTemplateDateTimeField';

export function isDateValue(value: string | undefined | null) {
    if (value == null) {
        return false;
    } else {
        return isNaN(Date.parse(value)) !== true;
    }
}

type IProps = IPreviewComponentProps<IValueOperational, IDateTimeFieldConfig>;

function getDateTimePreviewComponent(superdesk: ISuperdesk) {
    const {formatDateTime} = superdesk.localization;

    return class DateTimePreview extends React.PureComponent<IProps> {
        render() {
            if (this.props.value == null) {
                return null;
            } else {
                return <div>{formatDateTime(new Date(this.props.value))}</div>;
            }
        }
    };
}

export const defaultDateTimeConfig: IDateTimeFieldConfig = {
    initial_offset_minutes: 0,
    increment_steps: [],
};

function onTemplateCreate(_value: string, config: IDateTimeFieldConfig) {
    const initialOffset = config.initial_offset_minutes;

    if (_value == null) {
        return null;
    } else {
        return `{{ now|add_timedelta(minutes=${initialOffset})|iso_datetime }}`;
    }
}

const extension: IExtension = {
    activate: (superdesk: ISuperdesk) => {
        const gettext = superdesk.localization.gettext;

        const dateTimeField: ICustomFieldType<
            IValueOperational,
            IValueStorage,
            IDateTimeFieldConfig,
            IUserPreferences
        > = {
            id: 'datetime',
            label: gettext('Datetime'),
            editorComponent: getDateTimeField(superdesk),
            previewComponent: getDateTimePreviewComponent(superdesk),
            configComponent: getConfigComponent(superdesk),
            templateEditorComponent: getToggleDateTimeField(superdesk),
            onTemplateCreate: onTemplateCreate,
            hasValue: (val) => val === null || typeof val === 'string',
            getEmptyValue: () => null,
        };

        const result: IExtensionActivationResult = {
            contributions: {
                customFieldTypes: [
                    dateTimeField as unknown as ICustomFieldType<unknown, unknown, unknown, unknown>,
                ],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
