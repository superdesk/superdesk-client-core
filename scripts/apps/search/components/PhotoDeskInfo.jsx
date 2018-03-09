import React from 'react';
import PropTypes from 'prop-types';
import {createMarkUp} from '../helpers';

/**
 * PhotoDesk Info - renders item metadata
 */
export function PhotoDeskInfo(props) {
    const {gettextCatalog, datetime} = props.svc;

    const item = props.item;

    let source;

    if (item.source) {
        source = (
            <div className="sd-grid-item__content-block">
                <span className="sd-grid-item__text-label">{gettextCatalog.getString('source')}</span>
                <span className="sd-grid-item__text-strong">{item.source}</span>
            </div>
        );
    }

    return (
        <div className="sd-grid-item__content">
            <time>{datetime.longFormat(item.versioncreated)}</time>
            <span className="sd-grid-item__slugline"
                dangerouslySetInnerHTML={createMarkUp(item.headline || item.slugline || item.type)} />
            {source}
        </div>
    );
}

PhotoDeskInfo.propTypes = {
    svc: PropTypes.object.isRequired,
    item: PropTypes.any
};
