import React from 'react';
import PropTypes from 'prop-types';
import {MarkBtn} from 'apps/desks/components';

/**
 * @ngdoc React
 * @module superdesk.apps.desks
 * @name MarkedDeskItem
 * @param {Object} item the story to be marked
 * @param {Object} desk desk for the item to be marked
 * @param {Object} desks desksService
 * @description Represents a list item per given item and desk
 */
export class MarkedDeskItem extends React.Component {
    render() {
        return (
            <li key={'desk-' + this.props.desk._id}>
                <MarkBtn item={this.props.item} desk={this.props.desk} desks={this.props.desks} />
            </li>
        );
    }
}

/** Set the types of props for the MarkedDeskItem */
MarkedDeskItem.propTypes = {
    desks: PropTypes.object.isRequired,
    desk: PropTypes.object.isRequired,
    item: PropTypes.object.isRequired,
};