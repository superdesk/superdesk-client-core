import React from 'react';
import {DEFAULT_LIST_CONFIG} from 'scripts/apps/contacts/constants';
import * as fields from 'scripts/apps/contacts/components/fields';

export function renderArea(area, itemProps, props) {
    // If singleline preference is set, don't show second line
    if (itemProps.scope.singleLine && area === 'secondLine') {
        return;
    }

    /* globals __SUPERDESK_CONFIG__: true */
    const listConfig = __SUPERDESK_CONFIG__.contactList || DEFAULT_LIST_CONFIG;

    var specs = listConfig[area] || [];

    var contents = specs.map((field, index) => {
        if (fields[field]) {
            return fields[field](itemProps);
        }

        console.warn('missing field in list: ' + field);
        return null;
    }).filter(angular.identity);
    var elemProps = angular.extend({key: area}, props);

    return contents.length ? React.createElement('div', elemProps, contents) : null;
}

/**
 * renders the contents passed as array of elements
 */
export function renderContents(contents) {
    return React.createElement.apply(null, contents);
}

