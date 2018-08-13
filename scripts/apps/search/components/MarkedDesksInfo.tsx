import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import {MarkedDesksList} from './index';

import {
    closeActionsMenu,
    openActionsMenu,
    isCheckAllowed,
} from '../helpers';

/**
 * @ngdoc React
 * @module superdesk.apps.search
 * @name MarkedDesksInfo
 * @param {Object} svc the services nedded: desks and $timeout
 * @param {Object} item story to be marked
 * @param {Object} markedDesksById the dict of deskId and desk object
 * @description Creates a list of desks that is used for marking a story for a desk
 */
export class MarkedDesksInfo extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;


    constructor(props) {
        super(props);

        this.toggle = this.toggle.bind(this);
        this.getMarkedDesks = this.getMarkedDesks.bind(this);
        this.renderDropdown = this.renderDropdown.bind(this);
    }

    toggle(event) {
        if (event) {
            event.stopPropagation();
        }

        closeActionsMenu(this.props.item._id);
        this.renderDropdown();
    }

    getMarkedDesks() {
        var markedDesks = [];

        if (isCheckAllowed(this.props.item)) {
            if (this.props.item.archive_item && this.props.item.archive_item.marked_desks &&
                this.props.item.archive_item.marked_desks.length) {
                markedDesks = this.props.item.archive_item.marked_desks;
            } else {
                markedDesks = this.props.item.marked_desks || [];
            }
        }

        return markedDesks;
    }

    render() {
        var markedDesks = this.getMarkedDesks();

        return (
            <div className="highlights-box" onClick={this.toggle}>
                {markedDesks.length ? <div className="highlights-list dropdown">
                    <button className="dropdown__toggle">
                        <i className="icon-bell" />
                    </button>
                </div> : null
                }
            </div>
        );
    }

    renderDropdown() {
        var elem = React.createElement(MarkedDesksList, {
            item: this.props.item,
            desks: this.getMarkedDesks(),
            markedDesksById: this.props.markedDesksById,
            svc: this.props.svc,
        });

        var icon = ReactDOM.findDOMNode(this).getElementsByClassName('icon-bell')[0] ||
        ReactDOM.findDOMNode(this).getElementsByClassName('icon-bell')[0];

        openActionsMenu(elem, icon, this.props.item._id);
    }
}

/**
 * svc: contains $timeout and desks and is required
 * item: is the story to be marked
 * markedDesksById: dict of desks by desk id
 */
MarkedDesksInfo.propTypes = {
    svc: PropTypes.object.isRequired,
    item: PropTypes.any,
    markedDesksById: PropTypes.any,
};
