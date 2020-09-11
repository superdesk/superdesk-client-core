import React from 'react';
import _ from 'lodash';
import {DEFAULT_LIST_CONFIG, FB_URL, IG_URL, getLookupFields} from './constants';
import * as fields from './components/fields';
import {IContact, IContactType} from './Contacts';

export const onEventCapture = (event?) => {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
};

export function replaceUrls(contact: IContact): IContact {
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
export function renderContents(contents: IContact) {
    return React.createElement.apply(null, contents);
}

export function getContactType(contact: IContact): string {
    return contact && _.some([contact.first_name, contact.last_name], (v) => !_.isEmpty(v)) ? 'person' : 'organisation';
}

export function validateRequiredFormFields(contact: IContact, contactTypes: Array<IContactType>): boolean {
    return validateRequiredField(contact) &&
        validateMinRequiredField(contact) &&
        validateAssignableType(contact, contactTypes);
}

export function validateRequiredField(contact: IContact): boolean {
    const REQUIRED_CONTACT_FIELDS = getContactType(contact) === 'person' ?
        ['first_name', 'last_name'] : ['organisation'];

    let invalid = _.some(REQUIRED_CONTACT_FIELDS, (field) => {
        switch (field) {
        default:
            return _.isEmpty(contact[field]);
        }
    });

    return !invalid;
}

function contactHasEmailAddress(contact: IContact): boolean {
    return contact && contact.contact_email && contact.contact_email.length > 0 &&
        !contact.contact_email.some((email) => !email || email.length === 0);
}

export function validateMinRequiredField(contact: IContact): boolean {
    return _.some(getLookupFields(), (field) => {
        switch (field.name) {
        case 'contact_email':
            return contactHasEmailAddress(contact);
        case 'contact_phone':
        case 'mobile':
            return _.get(contact, field.name, []).length > 0 &&
                !_.some(_.map(contact[field.name], 'number'), (v) => _.isEmpty(v));
        default:
            return !_.isEmpty(contact[field.name]);
        }
    });
}

export function getMinRequiredFieldLabels() {
    return getLookupFields().map((f) => f.label).join(', ');
}

export function getMinRequiredFieldLabel(field) {
    const thisField = getLookupFields().find((f) => (f.name === field));

    return _.get(thisField, 'label', '');
}

export function validateAssignableType(contact: IContact, contactTypes: Array<IContactType>): boolean {
    const contactType = getContactTypeObject(contactTypes, contact.contact_type);

    if (!contactType || !contactType.assignable) {
        return true;
    }

    return contactHasEmailAddress(contact);
}

export function getContactTypeObject(contactTypes: Array<IContactType>, qcode: string): IContactType {
    if (contactTypes === undefined) {
        return null;
    }

    return contactTypes.find(
        (contactType: IContactType) => contactType.qcode === qcode,
    ) || null;
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
