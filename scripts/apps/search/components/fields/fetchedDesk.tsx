import React from 'react';
import PropTypes from 'prop-types';
import {FetchedDesksInfo} from '../index';

export const fetchedDesk: React.StatelessComponent<any> = (props) => {
    if (props.item.archived) {
        return React.createElement(FetchedDesksInfo, {
            item: props.item,
            key: 'desk',
            svc: props.svc,
        });
    }
};

fetchedDesk.propTypes = {
    svc: PropTypes.object.isRequired,
    item: PropTypes.any,
};
