import React from 'react';
import PropTypes from 'prop-types';
import {Associations} from '../index';

export const associations:React.StatelessComponent<any> = (props) => {
    return <Associations
        svc={props.svc}
        item={props.item}
        openAuthoringView={props.openAuthoringView}
        key="associations"
    />;
}

/*
 * item: item having associations
 * openAuthoringView: Opens the item in view mode
 * svc: contains gettext and is required
 */
associations.propTypes = {
    svc: PropTypes.any.isRequired,
    item: PropTypes.any,
    openAuthoringView: PropTypes.func.isRequired,
};

