import React from 'react';
import {HighlightsInfo} from 'apps/search/components';

export function highlights(props) {
    return React.createElement(HighlightsInfo, angular.extend({
        key: 'highlights'
    }, props));
}

highlights.propTypes = {
    item: React.PropTypes.any,
};
