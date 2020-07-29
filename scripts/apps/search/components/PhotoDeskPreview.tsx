import React from 'react';
import PropTypes from 'prop-types';
import {SelectBox} from './index';
import {CHECKBOX_PARENT_CLASS} from './constants';
import {IArticle} from 'superdesk-api';
import {getViewImage} from 'core/helpers/item';

interface IProps {
    item: IArticle;
    onMultiSelect: () => void;
}

/**
 * Media Preview - renders item thumbnail
 */
export const PhotoDeskPreview: React.StatelessComponent<IProps> = (props) => {
    const item = props.item;
    const classType = 'sd-grid-item__type-icon filetype-icon-' + props.item.type;

    let preview = <i className={classType} />;
    const thumnail = getViewImage(props.item);

    if (thumnail != null) {
        preview = <img src={thumnail.href} />;
    }

    return (
        <div className="sd-grid-item__thumb">
            {preview}
            <SelectBox
                item={item}
                classes={`sd-grid-item__checkbox ${CHECKBOX_PARENT_CLASS}`}
                onMultiSelect={props.onMultiSelect}
            />
        </div>
    );
};

PhotoDeskPreview.propTypes = {
    onMultiSelect: PropTypes.func,
    item: PropTypes.any,
};
