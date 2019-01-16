import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from 'core/ui/components/utils';

export const ItemContainer: React.StatelessComponent<any> = (props) => {
    const item = props.item;
    const desk = props.desk || null;
    let label;
    let value;

    if (item._type !== 'ingest') {
        if (desk) {
            label = gettext('desk:');
            value = item._type !== 'archived' ? desk.name : gettext('Archived from {{desk}}', {desk: desk.name});
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
            label,
        ),
        value,
    );
};

ItemContainer.propTypes = {
    item: PropTypes.any,
    desk: PropTypes.any,
};
