import {ICustomFieldType} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {Config} from './config';
import {Preview} from './preview';
import {Difference} from './difference';

export type IDropdownValue = string | number;

export interface IDropdownOption {
    id: IDropdownValue;
    label: string;
    color?: string;
}

export interface IDropdownConfig {
    type: 'text' | 'number';
    options: Array<IDropdownOption>;
    roundCorners: boolean;
}

export function getDropdownField(): ICustomFieldType<IDropdownValue, IDropdownConfig, never> {
    const field: ICustomFieldType<IDropdownValue, IDropdownConfig, never> = {
        id: 'dropdown',
        label: gettext('Dropdown (authoring-react)'),
        editorComponent: Editor,
        previewComponent: Preview,
        differenceComponent: Difference,
        configComponent: Config,
    };

    return field;
}
