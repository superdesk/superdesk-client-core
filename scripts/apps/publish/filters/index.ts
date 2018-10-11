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
        if (!search) {
            return items;
        }

        let filteredItems = items;

        if (search.name && search.name !== '') {
            let regExp = new RegExp(search.name, 'i');

            filteredItems = filteredItems.filter((item) => item.name.match(regExp));
        }

        if (search.subscriber_type && search.subscriber_type !== '') {
            filteredItems = filteredItems.filter((item) => item.subscriber_type === search.subscriber_type);
        }

        return filteredItems;
    };
}
