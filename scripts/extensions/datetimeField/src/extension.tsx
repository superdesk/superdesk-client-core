import * as React from 'react';

import {
    IExtension,
    IExtensionActivationResult,
    IPreviewComponentProps,
    ICommonFieldConfig,
    ICustomFieldType,
} from 'superdesk-api';
import {Editor} from './getDateTimeField';
import {Config} from './getConfigComponent';
import {TemplateEditor} from './getToggleTemplateDateTimeField';
import {superdesk} from './superdesk';
import {IUserPreferences, IValueOperational, IValueStorage} from './interfaces';

const {gettext} = superdesk.localization;

export function isDateValue(value: string | undefined | null) {
    if (value == null) {
        return false;
    } else {
        return isNaN(Date.parse(value)) !== true;
    }
}

const {formatDateTime} = superdesk.localization;

class DateTimePreview extends React.PureComponent<IPreviewComponentProps<IValueOperational, IConfig>> {
    render() {
        if (this.props.value == null) {
            return null;
        } else {
            return <div>{formatDateTime(new Date(this.props.value))}</div>;
        }
    }
}

export interface IConfig extends ICommonFieldConfig {
    initial_offset_minutes: number;
    increment_steps: Array<number>;
}

export const defaultDateTimeConfig: IConfig = {
    initial_offset_minutes: 0,
    increment_steps: [],
};

function onTemplateCreate(_value: string, config: IConfig) {
    const initialOffset = config.initial_offset_minutes;

    if (_value == null) {
        return null;
    } else {
        return `{{ now|add_timedelta(minutes=${initialOffset})|iso_datetime }}`;
    }
}

const datetimeField: ICustomFieldType<IValueOperational, IValueStorage, IConfig, IUserPreferences> = {
    id: 'datetime',
    label: gettext('Datetime'),
    editorComponent: Editor,
    previewComponent: DateTimePreview,
    configComponent: Config,
    templateEditorComponent: TemplateEditor,
    onTemplateCreate: onTemplateCreate,
    hasValue: (val) => val != null,
    getEmptyValue: () => null,
};

const extension: IExtension = {
    activate: () => {
        const result: IExtensionActivationResult = {
            contributions: {
                customFieldTypes: [
                    datetimeField as unknown as ICustomFieldType<unknown, unknown, unknown, unknown>,
                ],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
