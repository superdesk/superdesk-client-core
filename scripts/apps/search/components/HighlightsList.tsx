import React from 'react';
import {closeActionsMenu} from '../helpers';
import {gettext} from 'core/utils';
import ng from 'core/services/ng';
import {IArticle} from 'superdesk-api';

interface IProps {
    item: IArticle;
    highlights: any;
    highlightsById: any;
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
                        <i className="icon-close-small" />
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
