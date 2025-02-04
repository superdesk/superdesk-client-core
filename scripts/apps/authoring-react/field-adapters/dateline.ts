import {
    IArticle,
    IAuthoringFieldV2,
    IFieldAdapter,
} from 'superdesk-api';
import {gettext} from 'core/utils';

export const dateline: IFieldAdapter<IArticle> = {
    getFieldV2: () => {
        const fieldV2: IAuthoringFieldV2 = {
            id: 'dateline',
            name: gettext('Dateline'),
            fieldType: 'dateline',
            fieldConfig: null,
        };

        return fieldV2;
    },

    retrieveStoredValue: (item: IArticle) => item.dateline,

    storeValue: (value, article) => ({
        ...article,
        dateline: value,
    }),
};
