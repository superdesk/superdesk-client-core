import React from 'react';
import {DEFAULT_LIST_CONFIG, LOOKUP_FIELDS, FB_URL, IG_URL} from './constants';
import * as fields from './components/fields';
import ng from '../../core/services/ng';

export function gettext(str) {
    const gettext = ng.get('gettext');

    return gettext(str);
}

export const onEventCapture = (event) => {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
};

export function replaceUrls(contact) {
    if (contact.facebook) {
        _.set(contact, 'facebook', _.replace(contact.facebook, FB_URL, ''));
    }

    if (contact.instagram) {
        _.set(contact, 'instagram', _.replace(contact.instagram, IG_URL, ''));
    }

    return contact;
}

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

export function getContactType(contact) {
    return _.some([contact.first_name, contact.last_name], (v) => !_.isEmpty(v)) ? 'person' : 'organisation';
}

export function validateRequiredFormFields(contact) {
    return validateRequiredField(contact) && validateMinRequiredField(contact);
}


export function validateRequiredField(contact) {
    const REQUIRED_CONTACT_FIELDS = getContactType(contact) === 'person' ?
        ['first_name', 'last_name'] : ['organisation'];

    const REQUIRED_ARRAY_FIELDS = ['contact_email', 'mobile', 'contact_phone', 'contact_address'];

    const REQUIRED_FIELDS = REQUIRED_CONTACT_FIELDS.concat(REQUIRED_ARRAY_FIELDS);

    let invalid = _.some(REQUIRED_FIELDS, (field) => {
        switch (field) {
        case 'contact_address':
        case 'contact_email':
            return _.get(contact, field, 0).length > 0 && _.some(contact[field], (v) => _.isEmpty(v));
        case 'contact_phone':
        case 'mobile':
            return _.get(contact, field, 0).length > 0 && _.some(_.map(contact[field], 'number'), (v) => _.isEmpty(v));
        default:
            return _.isEmpty(contact[field]);
        }
    });

    return !invalid;
}

export function validateMinRequiredField(contact) {
    return _.some(LOOKUP_FIELDS, (field) => {
        switch (field) {
        case 'contact_email':
            return _.get(contact, field, 0).length > 0 && !_.some(contact[field], (v) => _.isEmpty(v));
        case 'contact_phone':
        case 'mobile':
            return _.get(contact, field, 0).length > 0 && !_.some(_.map(contact[field], 'number'), (v) => _.isEmpty(v));
        default:
            return !_.isEmpty(contact[field]);
        }
    });
}

export const scrollListItemIfNeeded = (selectedIndex, listRefElement) => {
    if (listRefElement.children.length > 0) {
        let activeElement = listRefElement.children[selectedIndex];

        if (activeElement) {
            let distanceOfSelItemFromVisibleTop = $(activeElement).offset().top -
                $(document).scrollTop() -
            $(listRefElement).offset().top - $(document).scrollTop();

            // If the selected item goes beyond container view, scroll it to middle.
            if (distanceOfSelItemFromVisibleTop >=
                    (listRefElement.clientHeight - activeElement.clientHeight) ||
                    distanceOfSelItemFromVisibleTop < 0) {
                $(listRefElement).scrollTop($(listRefElement).scrollTop() +
                    distanceOfSelItemFromVisibleTop -
                listRefElement.offsetHeight * 0.5);
            }
        }
    }
};
