import {IArticle, IAuthoringFieldV2, IFieldAdapter, IMediaConfig, IMediaValueOperational} from 'superdesk-api';
import {gettext} from 'core/utils';

export const mediaSelf: IFieldAdapter<IArticle> = {
    getFieldV2: () => {
        const fieldConfig: IMediaConfig = {
            maxItems: 1,
            allowPicture: true,
            allowAudio: true,
            allowVideo: true,
            showPictureCrops: true,

            showTitleEditingInput: false, // headline is already configured in the content profile

            showDescriptionEditingInput: false, // description is already configured in the content profile

            allowedWorkflows: {
                inProgress: true,
                published: true,
            },

            canRemoveItems: false, // because in this case, the media item is the entire article(`IArticle`)

            __editingOriginal: true,
        };

        const fieldV2: IAuthoringFieldV2 = {
            id: '_media_self',
            name: gettext('Media'),
            fieldType: 'media',
            fieldConfig,
        };

        return fieldV2;
    },
    retrieveStoredValue: (article): IMediaValueOperational => {
        return [article];
    },
    storeValue: (value: IMediaValueOperational, article) => {
        return value[0];
    },
};
