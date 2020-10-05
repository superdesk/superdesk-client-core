import React from 'react';
import {closeActionsMenu} from '../helpers';
import {gettext} from 'core/utils';
import ng from 'core/services/ng';
import {IArticle} from 'superdesk-api';

interface IProps {
    item: IArticle;
    highlights: any;
    highlightsById: any;
    viewType: string;
}

export class HighlightsList extends React.Component<IProps> {
    static propTypes: any;
    static defaultProps: any;

    timeout: any;
    highlightsService: any;
    $rootScope: any;
    $timeout: any;

    constructor(props) {
        super(props);

        this.removeHighlight = this.removeHighlight.bind(this);
        this.stopTimeout = this.stopTimeout.bind(this);
        this.close = this.close.bind(this);
        this.closeMenu = this.closeMenu.bind(this);

        this.highlightsService = ng.get('highlightsService');
        this.$rootScope = ng.get('$rootScope');
        this.$timeout = ng.get('$timeout');
    }

    removeHighlight(highlight, event) {
        event.stopPropagation();

        this.highlightsService.markItem(highlight._id, this.props.item);
        this.closeMenu();

        // TODO: Decouple highlights from multi-select feature
        // This event is removing an item from the list of multi-selected items when a highlight is removed
        // it doesn't work when a highlight is removed by another user
        // or an item disappears from the list because of different reasons - spiking or change of filters.
        if (this.props.viewType === 'highlights' && this.props.item.highlights.length === 1) {
            this.$rootScope.$broadcast('multi:remove', this.props.item._id);
        }
    }

    componentDidMount() {
        this.timeout = null;
    }

    componentWillUnmount() {
        this.stopTimeout();
    }

    stopTimeout() {
        this.timeout = this.$timeout.cancel(this.timeout);
    }

    closeMenu() {
        closeActionsMenu(this.props.item._id);
    }

    close() {
        this.timeout = this.$timeout(this.closeMenu, 2000, false);
    }

    render() {
        const highlights = this.props.highlights;
        const highlightsById = this.props.highlightsById || {};

        return (
            <ul
                className="dropdown dropdown__menu highlights-list-menu open"
                onMouseEnter={this.stopTimeout}
                onMouseLeave={this.close}
                data-test-id="highlights-list"
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
                                        this.highlightsService.hasMarkItemPrivilege()
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
