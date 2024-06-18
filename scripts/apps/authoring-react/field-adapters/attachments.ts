import {
    IArticle,
    IAuthoringFieldV2,
    IFieldAdapter,
    IAttachmentsConfig,
    IAttachmentsValueOperational,
} from 'superdesk-api';
import {gettext} from 'core/utils';

export const attachments: IFieldAdapter<IArticle> = {
    getFieldV2: (fieldEditor, fieldSchema) => {
        const fieldConfig: IAttachmentsConfig = {};

        const fieldV2: IAuthoringFieldV2 = {
            id: 'attachments',
            name: gettext('Attachments'),
            fieldType: 'attachments',
            fieldConfig,
        };

        return fieldV2;
    },

    retrieveStoredValue: (item): IAttachmentsValueOperational => {
        return (item.attachments ?? []).map(({attachment}) => ({id: attachment}));
    },

    storeValue: (value: IAttachmentsValueOperational, article, config) => {
        return {...article, attachments: value.map(({id}) => ({attachment: id}))};
    },
};
