import {ICustomFieldType, ICommonFieldConfig, IVocabulary} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {Config} from './config-main';
import {Preview} from './preview';
import {Difference} from './difference';

export type IDropdownValue = string | number | Array<string | number>;

export interface IDropdownOption {
    id: string | number;
    label: string;
    color?: string;
}

export interface IDropdownDataVocabulary extends ICommonFieldConfig {
    source: 'vocabulary';
    vocabularyId: IVocabulary['_id'];
    multiple: boolean;
}

export interface IDropdownDataCustom extends ICommonFieldConfig {
    source: 'manual-entry';
    type: 'text' | 'number';
    options: Array<IDropdownOption>;
    roundCorners: boolean;
    multiple: boolean;
}

export type IDropdownConfig = IDropdownDataCustom | IDropdownDataVocabulary;

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
