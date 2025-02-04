import {
    ICustomFieldType,
    IMediaValueOperational,
    IMediaValueStorage,
    IMediaConfig,
    IMediaUserPreferences,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {Preview} from './preview';
import {Difference} from './difference';
import {Config} from './config';

export const MEDIA_FIELD_ID = 'media';

export function getMediaField()
: ICustomFieldType<IMediaValueOperational, IMediaValueStorage, IMediaConfig, IMediaUserPreferences> {
    const field: ReturnType<typeof getMediaField> = {
        id: MEDIA_FIELD_ID,
        generic: true,
        label: gettext('Media (authoring-react)'),
        editorComponent: Editor,
        previewComponent: Preview,

        hasValue: (valueOperational) => valueOperational != null && valueOperational.length > 0,
        getEmptyValue: () => [],

        differenceComponent: Difference,
        configComponent: Config,
    };

    return field;
}
