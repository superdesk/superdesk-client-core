import {
    ICustomFieldType,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {
    IAttachmentsUserPreferences,
    IAttachmentsValueOperational,
    IAttachmentsValueStorage,
    IAttachmentsConfig,
} from './interfaces';
import {Preview} from './preview';
import {Difference} from './difference';

type IAttachmentsField = ICustomFieldType<
    IAttachmentsValueOperational,
    IAttachmentsValueStorage,
    IAttachmentsConfig,
    IAttachmentsUserPreferences
>;

export function getAttachmentsField(): IAttachmentsField {
    const field: IAttachmentsField = {
        id: 'attachments',
        label: gettext('Attachments (authoring-react)'),
        editorComponent: Editor,
        previewComponent: Preview,

        hasValue: (valueOperational) => valueOperational != null && valueOperational.length > 0,
        getEmptyValue: () => [],

        differenceComponent: Difference,
        configComponent: () => null,
    };

    return field;
}
