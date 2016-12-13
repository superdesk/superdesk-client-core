import React from 'react';

export function takepackage(props) {
    var item = props.item;
    var archiveItem = props.item.archive_item;

    var isTake = item.type === 'text' &&
        (item.takes && item.takes.sequence > 1 ||
        item._type === 'published' && archiveItem &&
        archiveItem.takes && archiveItem.takes.sequence > 1);

    var selectTakesPackage = function(event) {
        event.stopPropagation();
        props.selectTakesPackage();
    };

    if (isTake) {
        return React.createElement(
            'div',
            {className: 'state-label takes', onClick: selectTakesPackage, key: 'takepackage'},
            gettext('Takes')
        );
    }
}

takepackage.propTypes = {
    item: React.PropTypes.any,
    selectTakesPackage: React.PropTypes.func,
};
