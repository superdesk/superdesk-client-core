import {IContentFilter} from 'superdesk-interfaces/ContentFilter';
import {dataApi} from 'core/helpers/CrudManager';
import {getSelectSingleValueAutoComplete} from './select_single_value_autocomplete';

export const ContentFilterSingleValue = getSelectSingleValueAutoComplete(
    (searchString: string) => {
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
                                    $options: '-i',
                                },
                            },
                        ],
                    }
                    : {}
            ),
            50,
        );
    },
    () => '',
    (item: IContentFilter) => item.name,
);
