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

    removeHighlight(highlight) {
        const {highlightsService, $rootScope} = this.props.svc;
        const {scope} = this.props;

        return function(event) {
            event.stopPropagation();
            highlightsService.markItem(highlight._id, this.props.item);
            this.closeMenu();

            if (scope.viewType === 'highlights' && this.props.item.highlights.length === 1) {
                $rootScope.$broadcast('multi:remove', this.props.item._id);
            }
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

        const createHighlight = function(id) {
            const highlight = highlightsById[id];

            if (highlight) {
                return React.createElement(
                    'li',
                    {key: 'item-highlight-' + highlight._id},
                    highlight.name,
                    highlightsService.hasMarkItemPrivilege() ? React.createElement(
                        'button',
                        {className: 'btn btn--small btn--hollow btn--primary btn--ui-dark',
                            onClick: this.removeHighlight(highlight)},
                        gettext('REMOVE'),
                    ) : null,
                );
            }
        }.bind(this);

        const items = [
            React.createElement(
                'li',
                {key: 'item-highlight-label'},
                React.createElement(
                    'div',
                    {className: 'dropdown__menu-label'},
                    gettext('Marked For'),
                ),
                React.createElement(
                    'button',
                    {className: 'dropdown__menu-close', onClick: this.closeMenu},
                    React.createElement(
                        'i',
                        {className: 'icon-close-small icon--white'},
                    ),
                ),
            ),
        ];

        return React.createElement(
            'ul',
            {
                className: 'dropdown dropdown__menu highlights-list-menu open',
                onMouseEnter: this.stopTimeout,
                onMouseLeave: this.close,
            },
            items.concat(highlights.map(createHighlight)),
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
