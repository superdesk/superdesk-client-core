import {
    ICustomFieldType,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Editor} from './editor';
import {
    IMediaValueOperational,
    IMediaValueStorage,
    IMediaConfig,
    IMediaUserPreferences,
} from './interfaces';
import {Preview} from './preview';
import {Difference} from './difference';
import {Config} from './config';

export function getMediaField()
: ICustomFieldType<IMediaValueOperational, IMediaValueStorage, IMediaConfig, IMediaUserPreferences> {
    const field: ReturnType<typeof getMediaField> = {
        id: 'media',
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
