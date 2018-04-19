import React from 'react';
import PropTypes from 'prop-types';
import {ItemContainer, SelectBox} from './index';
import {createMarkUp} from '../helpers';

function hasThumbnail(item) {
    return item.renditions && item.renditions.thumbnail;
}

/**
 * Media Preview - renders item thumbnail
 */
export function MediaPreview(props) {
    var item = props.item;
    var headline = item.headline || item.slugline || item.type;
    // headline could contains html tags hence stripping for tooltips
    var headlineText = headline.replace(/(<([^>]+)>)/ig, '');
    var preview;

    if (hasThumbnail(props.item)) {
        preview = React.createElement(
            'img',
            {src: props.item.renditions.thumbnail.href}
        );
    }

    return React.createElement(
        'div',
        {className: 'media multi'},
        preview ? React.createElement(
            'figure',
            null,
            preview
        ) : null,
        React.createElement(
            'span',
            {className: 'text'},
            React.createElement(
                'small',
                {title: headlineText,
                    dangerouslySetInnerHTML: createMarkUp(headline)}
            ),
            React.createElement(ItemContainer, {
                item: item,
                desk: props.desk,
                svc: props.svc,
            })
        ),
        React.createElement(SelectBox, {
            item: item,
            onMultiSelect: props.onMultiSelect,
            svc: props.svc,
        })
    );
}

MediaPreview.propTypes = {
    svc: PropTypes.object.isRequired,
    onMultiSelect: PropTypes.func,
    desk: PropTypes.any,
    item: PropTypes.any,
};
