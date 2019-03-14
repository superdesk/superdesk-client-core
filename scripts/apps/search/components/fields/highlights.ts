import React from 'react';
import PropTypes from 'prop-types';
import {HighlightsInfo} from '../index';

export function highlights(props) {
    return React.createElement(HighlightsInfo, angular.extend({
        key: 'highlights',
    }, props));
}

highlights['propTypes'] = {
    // item is passed through to HighlightsInfo directly via props
    // eslint-disable-next-line react/no-unused-prop-types
    item: PropTypes.any,
};
