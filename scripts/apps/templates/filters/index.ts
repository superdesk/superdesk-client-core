import _ from 'lodash';
import {getTemplateFilters} from '../constants';

/**
 * @ngdoc filter
 * @module superdesk.apps.templates
 * @name FilterTemplatesFilter
 * @description Returns a function that allows filtering an array of
 * templates by various criteria.
 */
FilterTemplatesFilter.$inject = ['session', 'desks'];
export function FilterTemplatesFilter(session, desks) {
    const TEMPLATEFILTERS = getTemplateFilters();

    /**
     * @description Returns a new array based on the passed filter.
     * @param {Array<Object>} all - Array of templates to filter.
     * @param {Object} f - The filter. Contains keys 'label' and 'value'.
     * If the 'value' is 'All', all public templates and those owned by the current user are returned. For 'None',
     * only the items without a desk are returned. For 'Personal', only
     * non-public items are returned, 'Private' returns all none public templates belonging to other users and every
     * other value is a hash that represents the desk to filter by.
     * @returns {Array<Object>} The filtered array.
     */
    return function(all, f) {
        let template_list = (all || []).filter((item) => {
            switch (f.value) {
            case TEMPLATEFILTERS.All.value:
                return item.is_public || (session.identity._id === item.user);
            case TEMPLATEFILTERS.NoDesk.value:
                return item.is_public && !(item.template_desks && item.template_desks.length);
            case TEMPLATEFILTERS.Personal.value:
                return !item.is_public && (session.identity._id === item.user);
            case TEMPLATEFILTERS.Private.value:
                return !item.is_public && (session.identity._id !== item.user);
            default:
                return _.find(item.template_desks, (desk) => desk === f.value);
            }
        });

        if (f.value === TEMPLATEFILTERS.Private.value) {
            return _.sortBy(template_list, [((t) => desks.userLookup[t.user].display_name), 'template_name']);
        }
        return template_list;
    };
}
