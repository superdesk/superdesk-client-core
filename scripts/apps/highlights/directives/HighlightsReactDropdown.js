import React from 'react';

HighlightsReactDropdown.$inject = ['item', 'className', 'highlightsService', 'desks', 'gettext', 'noHighlightsLabel'];
export function HighlightsReactDropdown(item, className, highlightsService, desks, gettext, noHighlightsLabel) {
    var highlights = highlightsService.getSync(desks.getCurrentDeskId()) || {_items: []};

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

    var createHighlightItem = function(highlight) {
        return React.createElement(
            'li',
            {key: 'highlight-' + highlight._id},
            React.createElement(HighlightBtn, {item: item, highlight: highlight})
        );
    };

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

    return React.createElement(
        'ul',
        {className: className},
        highlights._items.length ? highlights._items.map(createHighlightItem) : React.createElement(noHighlights)
    );
}
