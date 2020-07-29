import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {forEach} from 'lodash';
import ng from 'core/services/ng';

import {HighlightsList} from './index';

import {
    closeActionsMenu,
    openActionsMenu,
    isCheckAllowed,
} from '../helpers';

export class HighlightsInfo extends React.PureComponent<any, any> {
    static propTypes: any;
    static defaultProps: any;

    $filter: any;
    highlightsService: any;
    $location: any;

    constructor(props) {
        super(props);

        this.toggle = this.toggle.bind(this);
        this.getHighlightStatuses = this.getHighlightStatuses.bind(this);
        this.getHighlights = this.getHighlights.bind(this);
        this.renderDropdown = this.renderDropdown.bind(this);

        this.$filter = ng.get('$filter');
        this.highlightsService = ng.get('highlightsService');
        this.$location = ng.get('$location');
    }

    toggle(event) {
        if (event) {
            event.stopPropagation();
        }

        closeActionsMenu(this.props.item._id);
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
        const highlightStatuses = {};
        const highlightsById = this.props.highlightsById;

        forEach(highlights, (highlight) => {
            const hours = this.$filter('hoursFromNow')(item.versioncreated);

            highlightStatuses[highlight] = this.highlightsService.isInDateRange(
                highlightsById[highlight], hours,
            );
        });

        return highlightStatuses;
    }

    getHighlights() {
        let itemHighlights = [];

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
        const highlights = this.getHighlights();

        const hasActiveHighlight = function() {
            const statuses = this.getHighlightStatuses(highlights, this.props.item);

            if (this.$location.path() === '/workspace/highlights') {
                return statuses[this.$location.search().highlight];
            }

            return highlights.some((h) => statuses[h]);
        }.call(this);

        return (
            <div className="highlights-box" onClick={this.toggle}>
                {
                    highlights.length
                        ? (
                            <div className="highlights-list dropdown">
                                <button className="dropdown__toggle" data-test-id="highlights-indicator">
                                    <i className={classNames({
                                        'icon-star': highlights.length === 1,
                                        'icon-multi-star': highlights.length > 1,
                                        'red': hasActiveHighlight,
                                    })} />
                                </button>
                            </div>
                        )
                        : null
                }
            </div>
        );
    }

    renderDropdown() {
        const elem = (
            <HighlightsList
                item={this.props.item}
                highlights={this.getHighlights()}
                highlightsById={this.props.highlightsById}
                viewType={this.props.viewType}
            />
        );

        const thisNode = ReactDOM.findDOMNode(this) as HTMLElement;

        const icon = thisNode.getElementsByClassName('icon-star')[0] ||
        thisNode.getElementsByClassName('icon-multi-star')[0];

        openActionsMenu(elem, icon, this.props.item._id);
    }
}

HighlightsInfo.propTypes = {
    item: PropTypes.any,
    highlightsById: PropTypes.any,
};
