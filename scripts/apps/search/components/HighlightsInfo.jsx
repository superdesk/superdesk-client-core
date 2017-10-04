import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {HighlightsList} from 'apps/search/components';

import {
    closeActionsMenu,
    isCheckAllowed,
    renderToBody
} from 'apps/search/helpers';

export class HighlightsInfo extends React.Component {
    constructor(props) {
        super(props);

        this.toggle = this.toggle.bind(this);
        this.getHighlightStatuses = this.getHighlightStatuses.bind(this);
        this.getHighlights = this.getHighlights.bind(this);
        this.renderDropdown = this.renderDropdown.bind(this);
    }

    toggle(event) {
        if (event) {
            event.stopPropagation();
        }

        closeActionsMenu();
        this.renderDropdown();
    }

    /**
     * Checks if the given item is in the daterange of the highlights
     * for every highlight given
     *
     * @param {array} highlights
     * @param {Object} item
     * @return {Object}
     */
    getHighlightStatuses(highlights, item) {
        const {$filter, highlightsService} = this.props.svc;

        var highlightStatuses = {};
        var highlightsById = this.props.highlightsById;

        _.forEach(highlights, (highlight) => {
            var hours = $filter('hoursFromNow')(item.versioncreated);

            highlightStatuses[highlight] = highlightsService.isInDateRange(
                highlightsById[highlight], hours
            );
        });

        return highlightStatuses;
    }

    getHighlights() {
        var itemHighlights = [];

        if (isCheckAllowed(this.props.item)) {
            if (this.props.item.archive_item && this.props.item.archive_item.highlights &&
                this.props.item.archive_item.highlights.length) {
                itemHighlights = this.props.item.archive_item.highlights;
            } else {
                itemHighlights = this.props.item.highlights || [];
            }
        }

        return itemHighlights;
    }

    render() {
        const {$location} = this.props.svc;
        var highlights = this.getHighlights();

        var hasActiveHighlight = function() {
            var statuses = this.getHighlightStatuses(highlights, this.props.item);

            if ($location.path() === '/workspace/highlights') {
                return statuses[$location.search().highlight];
            }

            return highlights.some((h) => statuses[h]);
        }.call(this);

        return React.createElement(
            'div',
            {
                className: 'highlights-box',
                onClick: this.toggle
            },
            highlights.length ? React.createElement(
                'div',
                {className: 'highlights-list dropdown'},
                React.createElement(
                    'button',
                    {className: 'dropdown__toggle'},
                    React.createElement('i', {
                        className: classNames({
                            'icon-star': highlights.length === 1,
                            'icon-multi-star': highlights.length > 1,
                            red: hasActiveHighlight
                        })
                    })
                )
            ) : null
        );
    }

    renderDropdown() {
        var elem = React.createElement(HighlightsList, {
            item: this.props.item,
            highlights: this.getHighlights(),
            highlightsById: this.props.highlightsById,
            svc: this.props.svc,
            scope: this.props.scope
        });

        var icon = ReactDOM.findDOMNode(this).getElementsByClassName('icon-star')[0] ||
        ReactDOM.findDOMNode(this).getElementsByClassName('icon-multi-star')[0];

        renderToBody(elem, icon);
    }
}

HighlightsInfo.propTypes = {
    svc: PropTypes.object.isRequired,
    scope: PropTypes.any.isRequired,
    item: PropTypes.any,
    highlightsById: PropTypes.any,
};
