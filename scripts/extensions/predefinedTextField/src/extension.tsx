import {IExtension, IExtensionActivationResult} from 'superdesk-api';
import {superdesk} from './superdesk';
import {PredefinedFieldEditor} from './editor';
import {PredefinedFieldConfig} from './config';
import {PredefinedFieldPreview} from './preview';

const {gettext} = superdesk.localization;

const extension: IExtension = {
    activate: () => {
        const result: IExtensionActivationResult = {
            contributions: {
                customFieldTypes: [
                    {
                        id: 'predefined-text',
                        label: gettext('Predefined text field'),
                        editorComponent: PredefinedFieldEditor,
                        previewComponent: PredefinedFieldPreview,
                        configComponent: PredefinedFieldConfig,
                    },
                ],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
