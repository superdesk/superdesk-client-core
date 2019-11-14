import * as React from 'react';

import {
    ISuperdesk,
    IExtension,
    IExtensionActivationResult,
    IPreviewComponentProps,
} from 'superdesk-api';
import {getDateTimeField} from './getDateTimeField';
import {getConfigComponent} from './getConfigComponent';

class DateTimePreview extends React.PureComponent<IPreviewComponentProps> {
    render() {
        if (this.props.value == null) {
            return null;
        } else {
            return <div>{new Date(this.props.value).toLocaleString()}</div>;
        }
    }
}

const extension: IExtension = {
    id: 'datetimeField',
    activate: (superdesk: ISuperdesk) => {
        const gettext = superdesk.localization.gettext;

        const result: IExtensionActivationResult = {
            contributions: {
                customFieldTypes: [
                    {
                        id: 'datetime',
                        label: gettext('Datetime'),
                        editorComponent: getDateTimeField(superdesk),
                        previewComponent: DateTimePreview,
                        configComponent: getConfigComponent(superdesk),
                    },
                ],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
