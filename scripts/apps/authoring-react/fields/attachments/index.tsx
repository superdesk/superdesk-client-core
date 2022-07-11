import {
    ICustomFieldType,
    IAttachmentsUserPreferences,
    IAttachmentsValueOperational,
    IAttachmentsValueStorage,
    IAttachmentsConfig,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {Preview} from './preview';
import {Difference} from './difference';
import {AuthoringAttachmentsWidget} from './authoring-widget';

type IAttachmentsField = ICustomFieldType<
    IAttachmentsValueOperational,
    IAttachmentsValueStorage,
    IAttachmentsConfig,
    IAttachmentsUserPreferences
>;

export function getWidgetLabel(): string {
    return gettext('Attachments');
}

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

        contributions: {
            authoringSideWidgets: [
                {
                    _id: 'attachments',
                    label: getWidgetLabel(),
                    component: AuthoringAttachmentsWidget,
                    order: 5,
                    icon: 'attachment',
                },
            ],
        },
    };

    return field;
}
