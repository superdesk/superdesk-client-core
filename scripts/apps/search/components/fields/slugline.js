import React from 'react';
import {createMarkUp} from 'apps/search/helpers';

export function slugline(props) {
    if (props.item.slugline) {
        return React.createElement(
            'span',
            {className: 'keyword', key: 'slugline',
                dangerouslySetInnerHTML: createMarkUp(props.item.slugline)}
        );
    }
}

slugline.propTypes = {
    item: React.PropTypes.any,
};
