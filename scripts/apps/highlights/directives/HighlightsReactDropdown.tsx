import React from 'react';
import HighlightBtn from '../components/HighlightBtn';

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

    const noHighlights =
        <li>
            <button disabled={true}>{noHighlightsLabel}</button>
        </li>;

    /*
     * Creates list with highlights
     * @return {React} List element
     */
    return (
        <ul className={className}>
            {highlights._items.length ? highlights._items.map((h) =>
                <li key={`highlight-${h._id}`}>
                    <HighlightBtn
                        item={item}
                        highlight={h}
                        service={highlightsService} />
                </li>,
            ) : noHighlights}
        </ul>
    );
}
