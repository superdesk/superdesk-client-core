import React from 'react';
import {FetchedDesksInfo} from 'apps/search/components';

export function fetchedDesk(props) {
    if (props.item.archived) {
        return React.createElement(FetchedDesksInfo, {
            item: props.item,
            key: 'desk',
            svc: props.svc
        });
    }
}

fetchedDesk.propTypes = {
    svc: React.PropTypes.object.isRequired,
    item: React.PropTypes.any,
};
