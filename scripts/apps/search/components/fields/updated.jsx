import React from 'react';

export function updated(props) {
    const {gettextCatalog} = props.svc;

    var openItem = function(event) {
        event.stopPropagation();
        props.openAuthoringView(props.item.rewritten_by);
    };

    if (props.item.rewritten_by) {
        return React.createElement(
            'div',
            {className: 'state-label updated', key: 'updated', onClick: openItem},
            gettextCatalog.getString('Updated')
        );
    }
}

updated.propTypes = {
    svc: React.PropTypes.any.isRequired,
    item: React.PropTypes.any,
    openAuthoringView: React.PropTypes.func
};
