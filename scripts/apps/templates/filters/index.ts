import _ from 'lodash';

/**
 * @ngdoc filter
 * @module superdesk.apps.templates
 * @name FilterTemplatesFilter
 * @description Returns a function that allows filtering an array of
 * templates by various criteria.
 */
FilterTemplatesFilter.$inject = [];
export function FilterTemplatesFilter() {
    /**
     * @description Returns a new array based on the passed filter.
     * @param {Array<Object>} all - Array of templates to filter.
     * @param {Object} f - The filter. Contains keys 'label' and 'value'.
     * If the 'value' is 'All', the entire array is returned. For 'None',
     * only the items without a desk are returned. For 'Personal', only
     * non-public items are returned, and every other value is a hash that
     * represents the desk to filter by.
     * @returns {Array<Object>} The filtered array.
     */
    return function(all, f) {
        return (all || []).filter((item) => {
            switch (f.value) {
            case 'All':
                return all;
            case 'None':
                return item.is_public && !(item.template_desks && item.template_desks.length);
            case 'Personal':
                return !item.is_public;
            default:
                return _.find(item.template_desks, (desk) => desk === f.value);
            }
        });
    };
}
