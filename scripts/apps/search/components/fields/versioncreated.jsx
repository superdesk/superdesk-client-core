import React from 'react';
import {TimeElem} from 'apps/search/components';

export function versioncreated(props) {
    return React.createElement(
        TimeElem, {
            date: props.item.versioncreated,
            key: 'versioncreated',
            svc: props.svc
        }
    );
}

versioncreated.propTypes = {
    svc: React.PropTypes.object.isRequired,
    item: React.PropTypes.any,
};
