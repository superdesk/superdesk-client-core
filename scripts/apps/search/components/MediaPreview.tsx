import React from 'react';
import {ItemContainer} from './index';
import {ILegacyMultiSelect, IMultiSelectNew} from './ItemList';
import {MultiSelectCheckbox} from './MultiSelectCheckbox';

function hasThumbnail(item) {
    return item.renditions && item.renditions.thumbnail;
}

interface IProps {
    desk: any;
    item: any;
    multiSelect: IMultiSelectNew | ILegacyMultiSelect;
}

/**
 * Media Preview - renders item thumbnail
 */
export const MediaPreview: React.StatelessComponent<IProps> = (props) => {
    const {item, multiSelect} = props;
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

    return (
        <div className="media multi">
            {
                preview ?
                    (<figure>{preview}</figure>)
                    : null
            }
            <span className="text">
                <small title={headlineText} dangerouslySetInnerHTML={{__html: headline}} />
                <ItemContainer
                    item={item}
                    desk={props.desk}
                />
            </span>
            <MultiSelectCheckbox
                item={item}
                multiSelect={multiSelect}
            />
        </div>
    );
};
