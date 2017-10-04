import React from 'react';
import PropTypes from 'prop-types';

export function ItemContainer(props) {
    const {gettext} = props.svc;
    const {gettextCatalog} = props.svc;

    var item = props.item;
    var desk = props.desk || null;
    var label, value;

    if (item._type !== 'ingest') {
        if (desk) {
            label = gettext('desk:');
            value = item._type !== 'archived' ? desk.name : gettextCatalog.getString('Archived from') + ' ' + desk.name;
        } else if (item._type === 'archive') {
            label = gettext('location:');
            value = gettext('workspace');
        } else if (item._type === 'archived') {
            label = '';
            value = gettext('archived');
        }
    }

    return React.createElement(
        'span',
        {className: 'container', title: value ? label + ' ' + value : null},
        React.createElement(
            'span',
            {className: 'location-desk-label'},
            label
        ),
        value
    );
}

ItemContainer.propTypes = {
    svc: PropTypes.object.isRequired,
    item: PropTypes.any,
    desk: PropTypes.any,
};
