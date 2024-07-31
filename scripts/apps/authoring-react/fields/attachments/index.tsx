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

export const ATTACHMENTS_FIELD_ID = 'attachments';
export const ATTACHMENTS_WIDGET_ID = 'attachments';

export function getAttachmentsField(): IAttachmentsField {
    const field: IAttachmentsField = {
        id: ATTACHMENTS_FIELD_ID,
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
                    _id: ATTACHMENTS_WIDGET_ID,
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
