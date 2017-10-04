import React from 'react';
import PropTypes from 'prop-types';

export function flags(props) {
    const {gettext} = props.svc;

    var flags = props.item.flags || {};
    var elems = [
        flags.marked_for_not_publication ?
            React.createElement(
                'div', {
                    className: 'state-label not-for-publication',
                    title: gettext('Not For Publication'),
                    key: 'not-for-publication'
                }, gettext('Not For Publication'))
            : null,
        flags.marked_for_legal ?
            React.createElement(
                'div', {
                    className: 'state-label legal',
                    title: gettext('Legal'),
                    key: 'legal'
                }, gettext('Legal'))
            : null,
        flags.marked_for_sms ?
            React.createElement(
                'div', {
                    className: 'state-label sms',
                    key: 'sms'},
                gettext('Sms'))
            : null
    ].filter(angular.identity);

    return elems.length ? React.createElement('div', {key: 'flags'}, elems) : null;
}

flags.propTypes = {
    svc: PropTypes.any.isRequired,
    item: PropTypes.any,
};
