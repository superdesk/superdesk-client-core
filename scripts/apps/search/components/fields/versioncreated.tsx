import React from 'react';
import PropTypes from 'prop-types';
import {TimeElem} from '../index';

export const versioncreated:React.StatelessComponent<any> = (props) => React.createElement(
    TimeElem, {
        date: props.item.versioncreated,
        key: 'versioncreated',
        svc: props.svc,
    }
);

versioncreated.propTypes = {
    svc: PropTypes.object.isRequired,
    item: PropTypes.any,
};
