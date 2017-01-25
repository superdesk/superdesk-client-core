import React from 'react';
import {
    closeActionsMenu
} from 'apps/search/helpers';

/**
 * @ngdoc React
 * @module superdesk.apps.search
 * @name MarkedDesksList
 * @param {Object} svc the services nedded: desks and $timeout
 * @param {Object} item story to be marked
 * @param {Object} markedDesksById the dict of deskId and desk object
 * @description Creates a list of desks that is used for marking a story for a desk
 */
export class MarkedDesksList extends React.Component {
    constructor(props) {
        super(props);

        this.removeMarkedDesk = this.removeMarkedDesk.bind(this);
        this.stopTimeout = this.stopTimeout.bind(this);
        this.close = this.close.bind(this);
    }

    removeMarkedDesk(desk) {
        const {desks} = this.props.svc;

        return function(event) {
            event.stopPropagation();
            desks.markItem(desk._id, this.props.item);
        }.bind(this);
    }

    componentDidMount() {
        this.timeout = null;
    }

    componentWillUnmount() {
        this.stopTimeout();
    }

    stopTimeout() {
        const {$timeout} = this.props.svc;

        this.timeout = $timeout.cancel(this.timeout);
    }

    close() {
        const {$timeout} = this.props.svc;

        this.timeout = $timeout(closeActionsMenu, 2000, false);
    }

    render() {
        const {desks} = this.props.svc;
        var markedDesks = _.isString(this.props.item.marked_desks[0]) ?
            this.props.item.marked_desks : _.map(this.props.item.marked_desks, 'desk_id');
        var markedDesksById = this.props.markedDesksById || {};

        return (
            <ul className="dropdown dropdown__menu highlights-list-menu open"
            onMouseEnter={this.stopTimeout} onMouseLeave={this.close}>
                <li key="item-marked-label">
                    <div className="dropdown__menu-label">{gettext('Marked For')}
                        <button className="dropdown__menu-close" onClick={closeActionsMenu}>
                            <i className="icon-close-small icon--white" />
                        </button>
                    </div>
                </li>
                {
                    markedDesks.map((d) => <li key={'item-marked-' + markedDesksById[d]._id}>
                    {markedDesksById[d].name}
                    {desks.hasMarkItemPrivilege() ? <button className="btn btn--mini"
                        onClick={this.removeMarkedDesk(markedDesksById[d])}>
                            {gettext('REMOVE')}</button> : null}
                    </li>)
            }
                </ul>
        );
    }
}

/**
 * svc: contains $timeout and desks and is required
 * item: is the story to be marked
 * markedDesksById: dict of desks by desk id
 */
MarkedDesksList.propTypes = {
    svc: React.PropTypes.object.isRequired,
    item: React.PropTypes.any,
    markedDesksById: React.PropTypes.any,
};
