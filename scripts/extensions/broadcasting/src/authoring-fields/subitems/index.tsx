import {ICustomFieldType} from 'superdesk-api';
import {superdesk} from '../../superdesk';
import {SUBITEMS_FIELD_TYPE} from './constants';
import {Difference} from './difference';
import {Editor} from './editor';
import {Preview} from './preview';

const {gettext} = superdesk.localization;

export interface ISubitem {
    qcode: string;
    technical_info: string; // plain-text
    content: string; // HTML
}

export type ISubitemsValueOperational = Array<ISubitem>;
export type ISubitemsValueStorage = ISubitemsValueOperational;
export type ISubitemsFieldConfig = never;
export type ISubitemsUserPreferences = never;

export function getSubItemsField()
: ICustomFieldType<ISubitemsValueOperational, ISubitemsValueStorage, ISubitemsFieldConfig, ISubitemsUserPreferences> {
    const field: ReturnType<typeof getSubItemsField> = {
        id: SUBITEMS_FIELD_TYPE,
        label: gettext('Subitems'),
        editorComponent: Editor,
        previewComponent: Preview,

        hasValue: (valueOperational) => valueOperational != null && Object.keys(valueOperational).length > 0,
        getEmptyValue: () => [],

        differenceComponent: Difference,
    };

    return field;
}
