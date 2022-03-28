import {ICustomFieldType, ICommonFieldConfig, IVocabulary} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {Config} from './config-main';
import {Preview} from './preview';
import {Difference} from './difference';
import {ITreeWithLookup} from 'core/ui/components/MultiSelectTreeWithTemplate';

/**
 * Depends on dropdown source:
 * manual-entry: string | number | Array<string> | Array<number>
 * vocabulary: string | Array<string>
 * remote-source (strings, numbers and plain objects are allowed): unknown | Array<unknown>
 */
export type IDropdownValue = unknown;

export interface IDropdownOption {
    id: string | number;
    label: string;
    color?: string;
}

export interface IDropdownConfigVocabulary extends ICommonFieldConfig {
    source: 'vocabulary';
    vocabularyId: IVocabulary['_id'];
    multiple: boolean;
}

export interface IDropdownConfigRemoteSource extends ICommonFieldConfig {
    source: 'remote-source';
    searchOptions(
        searchTerm: string,
        language: string,
        callback: (result: ITreeWithLookup<unknown>) => void,
    ): void;
    getLabel(item: unknown): string;
    getId(item: unknown): string;
    optionTemplate?: React.ComponentType<{item: unknown}>;
    valueTemplate?: React.ComponentType<{item: unknown}>;
    multiple: boolean;
}

export interface IDropdownTreeConfig extends ICommonFieldConfig {
    source: 'dropdown-tree';
    getItems(): ITreeWithLookup<unknown>;
    getLabel(item: unknown): string;
    getId(item: unknown): string;
    optionTemplate?: React.ComponentType<{item: unknown}>;
    valueTemplate?: React.ComponentType<{item: unknown}>;
    multiple: boolean;
}

export interface IDropdownConfigManualSource extends ICommonFieldConfig {
    source: 'manual-entry';
    type: 'text' | 'number';
    options: Array<IDropdownOption>;
    roundCorners: boolean;
    multiple: boolean;
}

export type IDropdownConfig =
    IDropdownConfigManualSource
    | IDropdownConfigVocabulary
    | IDropdownConfigRemoteSource
    | IDropdownTreeConfig;

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
