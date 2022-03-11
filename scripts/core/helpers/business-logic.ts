import {IVocabulary} from 'superdesk-api';
import {dataApi} from './CrudManager';

export function getCustomFieldVocabularies(): Promise<Array<IVocabulary>> {
    return dataApi.query<IVocabulary>(
        'vocabularies',
        1,
        {field: 'display_name', direction: 'ascending'},
        {
            $or: [
                {field_type: {$exists: true, $ne: null}},
                {custom_field_type: {$exists: true, $ne: null}},
            ],
        },
    ).then((res) => res._items);
}
