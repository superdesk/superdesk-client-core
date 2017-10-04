import React from 'react';
import PropTypes from 'prop-types';
import {MarkedDeskItem} from 'apps/desks/components';

/**
 * @ngdoc React
 * @module superdesk.apps.desks
 * @name MarkDesksDropdown
 * @param {String} className the class name for the ul element
 * @param {Object} item the story to be marked
 * @param {Object} desks desks service
 * @param {String} noDesksLabel the label to be visible when there's no desk
 * @description Creates a list of desks that is used for marking a story for a desk
 */
export class MarkDesksDropdown extends React.Component {
    render() {
        const items = this.props.desks.desks._items;

        return (
            <ul className={this.props.className}>
                {items.length ?
                    items.map((d) => <MarkedDeskItem key={d._id}
                        desk={d} item={this.props.item} desks={this.props.desks}/>)
                    : <li><button disabled="true">{this.props.noDesksLabel}</button></li>}
            </ul>
        );
    }
}

/** Set the types of props for the MarkDesksDropdown */
MarkDesksDropdown.propTypes = {
    className: PropTypes.string.isRequired,
    desks: PropTypes.object.isRequired,
    item: PropTypes.object.isRequired,
    noDesksLabel: PropTypes.string.isRequired
};
