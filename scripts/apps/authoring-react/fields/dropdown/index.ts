import {ICustomFieldType, IDropdownValue, IDropdownConfig} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {Config} from './config-main';
import {Preview} from './preview';
import {Difference} from './difference';

/**
 * Depends on dropdown source:
 * manual-entry: string | number | Array<string> | Array<number>
 * vocabulary: string | Array<string>
 * remote-source (strings, numbers and plain objects are allowed): unknown | Array<unknown>
 */

export const DROPDOWN_FIELD_ID = 'dropdown';

export function getDropdownField(): ICustomFieldType<IDropdownValue, IDropdownValue, IDropdownConfig, never> {
    const field: ICustomFieldType<IDropdownValue, IDropdownValue, IDropdownConfig, never> = {
        id: 'dropdown',
        label: gettext('Dropdown (authoring-react)'),
        editorComponent: Editor,
        previewComponent: Preview,
        hasValue: (valueOperational: IDropdownValue) => Array.isArray(valueOperational)
            ? valueOperational.length > 0
            : valueOperational != null,
        getEmptyValue: (config) => config.multiple ? [] : null,
        differenceComponent: Difference,
        configComponent: Config,
        toOperationalFormat: (valueStorage) => valueStorage,
    };

    return field;
}
