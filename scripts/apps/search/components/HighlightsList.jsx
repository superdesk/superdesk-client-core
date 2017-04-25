import React from 'react';
import {
    closeActionsMenu
} from 'apps/search/helpers';

export class HighlightsList extends React.Component {
    constructor(props) {
        super(props);

        this.removeHighlight = this.removeHighlight.bind(this);
        this.stopTimeout = this.stopTimeout.bind(this);
        this.close = this.close.bind(this);
    }

    removeHighlight(highlight) {
        const {highlightsService, $rootScope} = this.props.svc;
        const {scope} = this.props;

        return function(event) {
            event.stopPropagation();
            highlightsService.markItem(highlight._id, this.props.item);

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

    close() {
        const {$timeout} = this.props.svc;

        this.timeout = $timeout(closeActionsMenu, 2000, false);
    }

    render() {
        const {highlightsService} = this.props.svc;
        var highlights = this.props.highlights;
        var highlightsById = this.props.highlightsById || {};

        var createHighlight = function(id) {
            var highlight = highlightsById[id];

            if (highlight) {
                return React.createElement(
                    'li',
                    {key: 'item-highlight-' + highlight._id},
                    highlight.name,
                    highlightsService.hasMarkItemPrivilege() ? React.createElement(
                        'button',
                        {className: 'btn btn--mini', onClick: this.removeHighlight(highlight)},
                        gettext('REMOVE')
                    ) : null
                );
            }
        }.bind(this);

        var items = [
            React.createElement(
                'li',
                {key: 'item-highlight-label'},
                React.createElement(
                    'div',
                    {className: 'dropdown__menu-label'},
                    gettext('Marked For')
                ),
                React.createElement(
                    'button',
                    {className: 'dropdown__menu-close', onClick: closeActionsMenu},
                    React.createElement(
                        'i',
                        {className: 'icon-close-small icon--white'}
                    )
                )
            )
        ];

        return React.createElement(
            'ul',
            {
                className: 'dropdown dropdown__menu highlights-list-menu open',
                onMouseEnter: this.stopTimeout,
                onMouseLeave: this.close
            },
            items.concat(highlights.map(createHighlight))
        );
    }
}

HighlightsList.propTypes = {
    svc: React.PropTypes.object.isRequired,
    scope: React.PropTypes.any.isRequired,
    item: React.PropTypes.any,
    highlights: React.PropTypes.any,
    highlightsById: React.PropTypes.any,
};
