import React from 'react';
import PropTypes from 'prop-types';
import {SelectBox} from './index';

function hasThumbnail(item) {
    return item.renditions && item.renditions.thumbnail;
}

/**
 * Media Preview - renders item thumbnail
 */
export function PhotoDeskPreview(props) {
    const item = props.item;
    let preview;

    if (hasThumbnail(props.item)) {
        preview = <img src={item.renditions.thumbnail.href} />;
    }

    return (
        <div className="sd-grid-item__thumb">
            {preview}
            <SelectBox item={item} classes="sd-grid-item__checkbox"
                onMultiSelect={props.onMultiSelect} svc={props.svc}/>
        </div>
    );
}

PhotoDeskPreview.propTypes = {
    svc: PropTypes.object.isRequired,
    onMultiSelect: PropTypes.func,
    item: PropTypes.any
};
