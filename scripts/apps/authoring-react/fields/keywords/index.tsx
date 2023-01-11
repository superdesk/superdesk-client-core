import {
    ICustomFieldType,
    IKeywordsValueOperational,
    IKeywordsValueStorage,
    IKeywordsUserPreferences,
    IKeywordsFieldConfig,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {Preview} from './preview';
import {Difference} from './difference';

export const KEYWORDS_FIELD_ID = 'keywords';

type KeywordsFieldType = ICustomFieldType<
    IKeywordsValueOperational,
    IKeywordsValueStorage,
    IKeywordsFieldConfig,
    IKeywordsUserPreferences
>;

export function getKeywordsField(): KeywordsFieldType {
    const field: KeywordsFieldType = {
        id: KEYWORDS_FIELD_ID,
        label: gettext('Keywords (authoring-react)'),
        editorComponent: Editor,
        previewComponent: Preview,
        differenceComponent: Difference,
        hasValue: (valueOperational) => valueOperational != null,
        getEmptyValue: () => null,
        configComponent: () => null,
    };

    return field;
}
