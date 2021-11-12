import {IDesk, IRestApiResponse} from 'superdesk-api';
import {getSelectSingleValueAutoComplete} from './select_single_value_autocomplete';
import {gettext} from 'core/utils';
import ng from 'core/services/ng';

export const DeskSingleValue = getSelectSingleValueAutoComplete({
    query: (searchString: string) => {
        const desks = ng.get('desks').desks._items;
        const searchStringLower = searchString.toLocaleLowerCase();

        const matches = desks.filter((desk: IDesk) => desk.name.toLocaleLowerCase().includes(searchStringLower));
        const size = matches.length;

        const response: IRestApiResponse<IDesk> = {
            _items: matches,
            _links: {
                parent: {
                    title: '',
                    href: '',
                },
                self: {
                    title: '',
                    href: '',
                },
            },
            _meta: {
                max_results: size,
                total: size,
                page: 1,
            },
        };

        return Promise.resolve(response);
    },
    queryById: (id) => {
        const deskLookup = ng.get('desks').deskLookup;

        return Promise.resolve(deskLookup[id]);
    },
    getPlaceholder: () => gettext('Select a desk'),
    getLabel: (item: IDesk) => item.name,
});
