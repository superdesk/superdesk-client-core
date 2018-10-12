/**
 * @ngdoc filter
 * @module superdesk.apps.products
 * @name ProductsFilter
 * @description Returns a function that allows filtering an array of
 * products by various criteria.
 */
export function ProductsFilter() {
    /**
     * @description Returns a new array based on the passed filter.
     * @param {Array<Object>} items - Array of templates to filter.
     * @param {Object} search - The filter. search by name and product type.
     * @returns {Array<Object>} The filtered array.
     */
    return function(items, search) {
        if (!search) {
            return items;
        }

        let filteredItems = items;

        if (search.name && search.name !== '') {
            const regExp = new RegExp(search.name, 'i');

            filteredItems = filteredItems.filter((item) => item.name.match(regExp));
        }

        if (search.product_type && search.product_type !== '') {
            filteredItems = filteredItems.filter((item) => (item.product_type || 'both') === search.product_type);
        }

        return filteredItems;
    };
}
