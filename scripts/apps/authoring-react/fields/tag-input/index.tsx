import {
    ICustomFieldType,
    ITagInputValueOperational,
    ITagInputValueStorage,
    ITagInputUserPreferences,
    ITagInputFieldConfig,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {Preview} from './preview';
import {Difference} from './difference';

export const TAG_INPUT_FIELD_ID = 'tag-input';

type TagInputFieldType = ICustomFieldType<
    ITagInputValueOperational,
    ITagInputValueStorage,
    ITagInputFieldConfig,
    ITagInputUserPreferences
>;

export function getTagInputField(): TagInputFieldType {
    const field: TagInputFieldType = {
        id: TAG_INPUT_FIELD_ID,
        label: gettext('Tag-input (authoring-react)'),
        editorComponent: Editor,
        previewComponent: Preview,
        differenceComponent: Difference,
        hasValue: (valueOperational) => (valueOperational?.length ?? 0) > 0,
        getEmptyValue: () => null,
        configComponent: () => null,
    };

    return field;
}
