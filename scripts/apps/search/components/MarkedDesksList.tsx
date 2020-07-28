import React from 'react';
import {closeActionsMenu} from '../helpers';
import {isString, map} from 'lodash';
import {gettext} from 'core/utils';
import ng from 'core/services/ng';
import {IArticle} from 'superdesk-api';

interface IProps {
    item: IArticle;
    markedDesksById: any;
}

/**
 * @ngdoc React
 * @module superdesk.apps.search
 * @name MarkedDesksList
 * @param {Object} item story to be marked
 * @param {Object} markedDesksById the dict of deskId and desk object
 * @description Creates a list of desks that is used for marking a story for a desk
 */
export class MarkedDesksList extends React.Component<IProps> {
    static propTypes: any;
    static defaultProps: any;

    timeout: any;
    $timeout: any;
    desks: any;

    constructor(props) {
        super(props);

        this.removeMarkedDesk = this.removeMarkedDesk.bind(this);
        this.stopTimeout = this.stopTimeout.bind(this);
        this.close = this.close.bind(this);
        this.closeMenu = this.closeMenu.bind(this);

        this.$timeout = ng.get('$timeout');
        this.desks = ng.get('desks');
    }

    removeMarkedDesk(desk) {
        const {desks} = this;

        return function(event) {
            event.stopPropagation();
            desks.markItem(desk._id, this.props.item);
            this.closeMenu();
        }.bind(this);
    }

    componentDidMount() {
        this.timeout = null;
    }

    componentWillUnmount() {
        this.stopTimeout();
    }

    closeMenu() {
        closeActionsMenu(this.props.item._id);
    }

    stopTimeout() {
        const {$timeout} = this;

        this.timeout = $timeout.cancel(this.timeout);
    }

    close() {
        const {$timeout} = this;

        this.timeout = $timeout(this.closeMenu, 2000, false);
    }

    render() {
        const {desks} = this;
        const markedDesks = isString(this.props.item.marked_desks[0]) ?
            this.props.item.marked_desks : map(this.props.item.marked_desks, 'desk_id');
        const markedDesksById = this.props.markedDesksById || {};

        return (
            <ul className="dropdown dropdown__menu highlights-list-menu open"
                onMouseEnter={this.stopTimeout} onMouseLeave={this.close}>
                <li key="item-marked-label">
                    <div className="dropdown__menu-label">{gettext('Marked For')}
                        <button className="dropdown__menu-close" onClick={this.closeMenu}>
                            <i className="icon-close-small icon--white" />
                        </button>
                    </div>
                </li>
                {
                    markedDesks.map((d) => <li key={'item-marked-' + markedDesksById[d]._id}>
                        {markedDesksById[d].name}
                        {desks.hasMarkItemPrivilege() ?
                            <button className="btn btn--small btn--hollow btn--primary btn--ui-dark"
                                onClick={this.removeMarkedDesk(markedDesksById[d])}>
                                {gettext('REMOVE')}</button> : null}
                    </li>)
                }
            </ul>
        );
    }
}
