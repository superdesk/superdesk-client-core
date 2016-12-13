import React from 'react';

export function ItemContainer(props) {
    const {gettext} = props.svc;

    var item = props.item;
    var desk = props.desk || null;
    var label, value;

    if (item._type !== 'ingest') {
        if (desk) {
            label = gettext('desk:');
            value = desk.name;
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
    svc: React.PropTypes.object.isRequired,
    item: React.PropTypes.any,
    desk: React.PropTypes.any,
};
