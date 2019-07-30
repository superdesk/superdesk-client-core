import React from 'react';
import PropTypes from 'prop-types';
import {Associations} from '../index';
import {IPropsItemListInfo} from '../ListItemInfo';

export const associations: React.StatelessComponent<IPropsItemListInfo> = (props) => <Associations
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
