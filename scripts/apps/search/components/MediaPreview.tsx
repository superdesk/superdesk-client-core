import React from 'react';
import {ItemContainer, SelectBox} from './index';

function hasThumbnail(item) {
    return item.renditions && item.renditions.thumbnail;
}

interface IProps {
    onMultiSelect: any;
    desk: any;
    item: any;
}

/**
 * Media Preview - renders item thumbnail
 */
export const MediaPreview: React.StatelessComponent<IProps> = (props) => {
    const item = props.item;
    const headline = item.headline || item.slugline || item.type;
    // headline could contains html tags hence stripping for tooltips
    const headlineText = headline.replace(/(<([^>]+)>)/ig, '');
    let preview;

    if (hasThumbnail(props.item)) {
        preview = React.createElement(
            'img',
            {src: props.item.renditions.thumbnail.href},
        );
    }

    return React.createElement(
        'div',
        {className: 'media multi'},
        preview ? React.createElement(
            'figure',
            null,
            preview,
        ) : null,
        React.createElement(
            'span',
            {className: 'text'},
            React.createElement(
                'small',
                {title: headlineText,
                    dangerouslySetInnerHTML: {__html: headline}},
            ),
            React.createElement(ItemContainer, {
                item: item,
                desk: props.desk,
            }),
        ),
        React.createElement(SelectBox, {
            item: item,
            onMultiSelect: props.onMultiSelect,
        }),
    );
};
