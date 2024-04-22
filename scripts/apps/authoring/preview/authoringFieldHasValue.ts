import {IAuthoringField} from './types';
import {assertNever} from 'core/helpers/typescript-helpers';

function hasValueString(str: string | undefined): boolean {
    return (str?.trim().length ?? 0) > 0;
}

function hasValueArray(arr: Array<unknown> | undefined | null): boolean {
    return arr != null && arr.length > 0;
}

export function authoringFieldHasValue(field: IAuthoringField) {
    switch (field.type) {
    case 'plain-text':
        return hasValueString(field.value);
    case 'html':
        return hasValueString(field.value);
    case 'subjects':
        return hasValueArray(field.value);
    case 'vocabulary-values':
        return hasValueString(field.value.vocabularyId) && hasValueArray(field.value.qcodes);
    case 'urls':
        return hasValueArray(field.value);
    case 'media-gallery':
        return hasValueArray(field.value);
    case 'related-articles':
        return hasValueArray(field.value);
    case 'embed':
        return hasValueString(field.value.embed);
    case 'attachments':
        return hasValueArray(field.value);
    case 'custom':
        return field.value != null;
    default:
        assertNever(field);
    }
}
