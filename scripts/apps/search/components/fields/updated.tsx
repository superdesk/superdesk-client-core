import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from 'core/ui/components/utils';

export const updated: React.StatelessComponent<any> = (props) => {
    const openItem = function(event) {
        event.stopPropagation();
        props.openAuthoringView(props.item.rewritten_by);
    };

    if (props.item.rewritten_by) {
        return React.createElement(
            'div',
            {className: 'state-label updated', key: 'updated', onClick: openItem},
            gettext('Updated'),
        );
    }
};

updated.propTypes = {
    item: PropTypes.any,
    openAuthoringView: PropTypes.func,
};
