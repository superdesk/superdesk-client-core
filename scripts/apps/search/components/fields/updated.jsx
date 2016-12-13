import React from 'react';

export function updated(props) {
    const {gettextCatalog} = props.svc;

    var selectUpdate = function(event) {
        event.stopPropagation();
        props.selectUpdate();
    };

    if (props.item.rewritten_by) {
        return React.createElement(
            'div',
            {className: 'state-label updated', key: 'updated', onClick: selectUpdate},
            gettextCatalog.getString('Updated')
        );
    }
}

updated.propTypes = {
    svc: React.PropTypes.any.isRequired,
    item: React.PropTypes.any,
    selectUpdate: React.PropTypes.func,
};
