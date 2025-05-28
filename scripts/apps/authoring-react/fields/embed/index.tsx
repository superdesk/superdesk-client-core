import {
    ICustomFieldType,
    IEmbedValueOperational,
    IEmbedValueStorage,
    IEmbedConfig,
    IEmbedUserPreferences,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {Preview} from './preview';
import {Difference} from './difference';

export function getEmbedField()
: ICustomFieldType<IEmbedValueOperational, IEmbedValueStorage, IEmbedConfig, IEmbedUserPreferences> {
    const field: ReturnType<typeof getEmbedField> = {
        id: 'embed',
        generic: true,
        label: gettext('Embed (authoring-react)'),
        editorComponent: Editor,
        previewComponent: Preview,

        hasValue: (valueOperational) => valueOperational != null && valueOperational.embed?.trim().length > 0,
        getEmptyValue: () => ({embed: '', description: ''}),

        differenceComponent: Difference,
        configComponent: () => null,
    };

    return field;
}
