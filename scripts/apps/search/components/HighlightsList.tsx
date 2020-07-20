import React from 'react';
import PropTypes from 'prop-types';
import {closeActionsMenu} from '../helpers';
import {gettext} from 'core/utils';

export class HighlightsList extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    timeout: any;

    constructor(props) {
        super(props);

        this.removeHighlight = this.removeHighlight.bind(this);
        this.stopTimeout = this.stopTimeout.bind(this);
        this.close = this.close.bind(this);
        this.closeMenu = this.closeMenu.bind(this);
    }

    removeHighlight(highlight, event) {
        const {highlightsService, $rootScope} = this.props.svc;
        const {scope} = this.props;

        event.stopPropagation();

        highlightsService.markItem(highlight._id, this.props.item);
        this.closeMenu();

        // TODO: Decouple highlights from multi-select feature
        // This event is removing an item from the list of multi-selected items when a highlight is removed
        // it doesn't work when a highlight is removed by another user
        // or an item disappears from the list because of different reasons - spiking or change of filters.
        if (scope.viewType === 'highlights' && this.props.item.highlights.length === 1) {
            $rootScope.$broadcast('multi:remove', this.props.item._id);
        }
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

    closeMenu() {
        closeActionsMenu(this.props.item._id);
    }

    close() {
        const {$timeout} = this.props.svc;

        this.timeout = $timeout(this.closeMenu, 2000, false);
    }

    render() {
        const {highlightsService} = this.props.svc;
        const highlights = this.props.highlights;
        const highlightsById = this.props.highlightsById || {};

        return (
            <ul
                className="dropdown dropdown__menu highlights-list-menu open"
                onMouseEnter={this.stopTimeout}
                onMouseLeave={this.close}
            >
                <li>
                    <div className="dropdown__menu-label">{gettext('Marked For')}</div>
                    <button className="dropdown__menu-close" onClick={this.closeMenu}>
                        <i className="icon-close-small icon--white" />
                    </button>
                </li>

                {
                    highlights
                        .filter((id) => highlightsById[id] != null)
                        .map((id) => {
                            const highlight = highlightsById[id];

                            return (
                                <li key={id}>
                                    {highlight.name}
                                    {
                                        highlightsService.hasMarkItemPrivilege()
                                            ? (
                                                <button
                                                    className="btn btn--small btn--hollow btn--primary btn--ui-dark"
                                                    onClick={(event) => {
                                                        this.removeHighlight(highlight, event);
                                                    }}
                                                >
                                                    {gettext('REMOVE')}
                                                </button>
                                            )
                                            : null
                                    }
                                </li>
                            );
                        })
                }
            </ul>
        );
    }
}

HighlightsList.propTypes = {
    svc: PropTypes.object.isRequired,
    scope: PropTypes.any.isRequired,
    item: PropTypes.any,
    highlights: PropTypes.any,
    highlightsById: PropTypes.any,
};
