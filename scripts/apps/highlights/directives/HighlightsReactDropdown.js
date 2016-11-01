import React from 'react';

/**
 * @ngdoc directive
 * @module superdesk.apps.highlights
 * @name HighlightsReactDropdown
 *
 * @requires React
 * @requires item
 * @requires className
 * @requires highlightsService
 * @requires desks
 * @requires noHighlightsLabel
 *
 * @param {Object} [highlights] collection of highlights
 *
 * @description Creates dropdown react element with list of available highlights
 */
HighlightsReactDropdown.$inject = ['item', 'className', 'highlightsService', 'desks', 'noHighlightsLabel'];
export function HighlightsReactDropdown(item, className, highlightsService, desks, noHighlightsLabel) {
    var highlights = highlightsService.getSync(desks.getCurrentDeskId()) || {_items: []};

    /*
     * Creates specific highlight button in list
     * @return {React} Language button
     */
    var HighlightBtn = React.createClass({
        markHighlight: function(event) {
            event.stopPropagation();
            highlightsService.markItem(this.props.highlight._id, this.props.item);
        },
        render: function() {
            var item = this.props.item;
            var highlight = this.props.highlight;
            var isMarked = item.highlights && item.highlights.indexOf(highlight._id) >= 0;
            return React.createElement(
                'button',
                {disabled: isMarked, onClick: this.markHighlight},
                React.createElement('i', {className: 'icon-star'}),
                highlight.label
            );
        }
    });

    /*
     * Creates list element for specific highlight
     * @return {React} Single list element
     */
    var createHighlightItem = function(highlight) {
        return React.createElement(
            'li',
            {key: 'highlight-' + highlight._id},
            React.createElement(HighlightBtn, {item: item, highlight: highlight})
        );
    };

    /*
     * If there are no highlights, print none-highlights message
     * @return {React} List element
     */
    var noHighlights = function() {
        return React.createElement(
            'li',
            {},
            React.createElement(
                'button',
                {disabled: true},
                noHighlightsLabel)
        );
    };

    /*
     * Creates list with highlights
     * @return {React} List element
     */
    return React.createElement(
        'ul',
        {className: className},
        highlights._items.length ? highlights._items.map(createHighlightItem) : React.createElement(noHighlights)
    );
}
