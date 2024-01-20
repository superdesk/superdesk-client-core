import {ISuperdesk, IVocabulary} from 'superdesk-api';
import {Map} from 'immutable';

export function getAutoTaggingVocabularyLabels(superdesk: ISuperdesk): Promise<Map<string, string>> /* id, label */ {
    const {dataApi} = superdesk;

    return dataApi.query<IVocabulary>(
        'vocabularies',
        1,
        {field: 'name', direction: 'ascending'},
        {imatrics_enabled: true},
    ).then((vocabularies) => {
        return Map(
            vocabularies._items.map(({_id, display_name}) => [_id, display_name]),
        );
    });
}
