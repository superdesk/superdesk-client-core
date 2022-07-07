import {IArticle, IAuthoringFieldV2, IFieldAdapter} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IMediaConfig, IMediaValueOperational} from '../fields/media/interfaces';

export const feature_media: IFieldAdapter<IArticle> = {
    getFieldV2: (fieldEditor, fieldSchema) => {
        const fieldConfig: IMediaConfig = {
            maxItems: 1,
            allowPicture: true,
            allowAudio: true,
            allowVideo: true,
            showPictureCrops: fieldEditor.showCrops,
            showTitleEditingInput: fieldEditor.imageTitle,
            allowedWorkflows: {
                inProgress: true,
                published: true,
            },
        };

        const fieldV2: IAuthoringFieldV2 = {
            id: 'feature_media',
            name: gettext('Feature media'),
            fieldType: 'media',
            fieldConfig,
        };

        return fieldV2;
    },
    retrieveStoredValue: (article): IMediaValueOperational => {
        if (article.associations?.featuremedia == null) {
            return [];
        } else {
            return [article.associations.featuremedia];
        }
    },
    storeValue: (value: IMediaValueOperational, article) => {
        if (value.length < 1) {
            return article;
        } else {
            return {
                ...article,
                associations: {
                    ...(article.associations ?? {}),
                    featuremedia: value[0],
                },
            };
        }
    },
};
