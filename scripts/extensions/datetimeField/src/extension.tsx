import * as React from 'react';

import {
    ISuperdesk,
    IExtension,
    IExtensionActivationResult,
    IPreviewComponentProps,
} from 'superdesk-api';
import {getDateTimeField} from './getDateTimeField';

class DateTimePreview extends React.PureComponent<IPreviewComponentProps> {
    render() {
        return <div>{this.props.value}</div>;
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
                    },
                ],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
