import {IContentFilter} from 'superdesk-interfaces/ContentFilter';
import {dataApi} from 'core/helpers/CrudManager';
import {getSelectSingleValueAutoComplete} from './select_single_value_autocomplete';

export const ContentFilterSingleValue = getSelectSingleValueAutoComplete({
    query: (searchString: string) => {
        return dataApi.query<IContentFilter>(
            'content_filters',
            1,
            {field: 'name', direction: 'ascending'},
            (
                searchString.length > 0
                    ? {
                        $and: [
                            {
                                name: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                        ],
                    }
                    : {}
            ),
            200,
        );
    },
    queryById: (id) => dataApi.findOne<IContentFilter>('content_filters', id),
    getPlaceholder: () => '',
    getLabel: (item: IContentFilter) => item.name,
});
