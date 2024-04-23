import {IAuthoringField} from './types';
import {assertNever} from 'core/helpers/typescript-helpers';

export function isMediaField(field: IAuthoringField) {
    switch (field.type) {
    case 'plain-text':
    case 'html':
    case 'subjects':
    case 'vocabulary-values':
    case 'urls':
    case 'related-articles':
    case 'attachments':
    case 'custom':
        return false;
    case 'media-gallery':
    case 'embed':
        return true;
    default:
        assertNever(field);
    }
}
