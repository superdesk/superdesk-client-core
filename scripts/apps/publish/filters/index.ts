/**
 * @ngdoc filter
 * @module superdesk.apps.publish
 * @name SubscribersFilter
 * @description Returns a function that allows filtering an array of
 * subscribes by various criteria.
 */
export function SubscribersFilter() {
    /**
     * @description Returns a new array based on the passed filter.
     * @param {Array<Object>} items - Array of templates to filter.
     * @param {Object} search - The filter. search by name and subscriber type.
     * @returns {Array<Object>} The filtered array.
     */
    return function(items, search) {
        if (!items) {
            return;
        }

        let filteredItems = items;

        if (search.name && search.name !== '') {
            const regExp = new RegExp(search.name, 'i');

            filteredItems = filteredItems.filter((item) => item.name.match(regExp));
        }

        if (search.subscriber_type && search.subscriber_type !== '') {
            filteredItems = filteredItems.filter((item) => item.subscriber_type === search.subscriber_type);
        }

        if (search.subscriber_status && search.subscriber_status.value != null) {
            filteredItems = filteredItems.filter((item) => item.is_active === search.subscriber_status.value);
        }

        return filteredItems;
    };
}
