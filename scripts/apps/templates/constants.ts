import {gettext} from 'core/utils';

/*
	Labels and values for the template filter dropdown
*/
export function getTemplateFilters() {
    return Object.freeze({
        All: {label: gettext('All'), value: 'All'},
        Private: {label: gettext('Private'), value: 'Private'},
        Personal: {label: gettext('Personal'), value: 'Personal'},
        NoDesk: {label: gettext('No Desk'), value: 'None'},
    });
}
