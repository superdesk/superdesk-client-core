import React from 'react';
import PropTypes from 'prop-types';
import {Associations} from '../index';

export const associations: React.StatelessComponent<any> = (props) => <Associations
    item={props.item}
    openAuthoringView={props.openAuthoringView}
    key="associations"
/>;

/*
 * item: item having associations
 * openAuthoringView: Opens the item in view mode
 */
associations.propTypes = {
    item: PropTypes.any,
    openAuthoringView: PropTypes.func.isRequired,
};
