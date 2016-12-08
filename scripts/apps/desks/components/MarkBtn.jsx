import React from 'react';

/**
 * @ngdoc React
 * @module superdesk.apps.desks
 * @name MarkBtn
 * @param {Object} item the story to be marked
 * @param {Object} desk desk for the item to be marked
 * @param {Object} desk desksService
 * @description Represents a button for given item to be marked for the given desk
 */
export class MarkBtn extends React.Component {
    constructor(props) {
        super(props);
        this.item = props.item;
        this.desk = props.desk;
        this.desks = props.desks;
        this.isMarked = this.item.marked_desks &&
            this.item.marked_desks.some((md) => md.desk_id === this.desk._id);
        this.markDesk = this.markDesk.bind(this);
    }

    /** Marks the give item for a given desk */
    markDesk() {
        event.stopPropagation();
        this.desks.markItem(this.desk._id, this.item);
    }

    render() {
        return (
            <button disabled={this.isMarked} onClick={this.markDesk}>
                <i className="icon-bell" />{this.desk.name}
            </button>
        );
    }
}

/** Set the types of props for the MrkBtn */
MarkBtn.propTypes = {
    desks: React.PropTypes.object.isRequired,
    desk: React.PropTypes.object.isRequired,
    item: React.PropTypes.object.isRequired,
};